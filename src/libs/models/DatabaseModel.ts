const sanitizeHtml = require('sanitize-html')
const pgFormat = require('pg-format')
const PostgresSqlParser = require('../PostgresSqlParser').default

const NOOP = async () => {}

export default function DatabaseModel(postgres: any, table: string): IModel {
  return {
    accessibleColumns: [],
    restrictedColumns: [],
    record: {},
    table: table,
    isNewRecord: false,

    // functions to execute immediately before or after saving a record (see #save)
    // If it's asynchronous, it should return a promise
    callbacks: {
      beforeSave: NOOP,
      afterSave: NOOP,
    },

    _getSanitizedValue(value: any, shouldSanitize: boolean = true) {
      if (!shouldSanitize) return value

      if (typeof value === 'string') return this.sanitizeHtmlString(value)

      //json or jsonb data
      if (typeof value === 'object' && value) {
        if (value.toString() === '[object Object]') {
          return JSON.stringify(
            Object.keys(value).reduce(
              (obj, key) => ({
                ...obj,
                [key]:
                  typeof value[key] === 'string'
                    ? this.sanitizeHtmlString(value[key])
                    : value[key],
              }),
              {}
            )
          )
        } else if (value instanceof Array) {
          return JSON.stringify(value)
        }
      }

      return value
    },

    setRecord(obj: any, allowRestrictedColumns: boolean = false) {
      const cachedAlreadySetCols: object = { ...this.record }
      this.record = { ...this.record, ...obj }

      if (!allowRestrictedColumns)
        this.restrictedColumns.forEach((col: string) => delete this.record[col])

      return (this.record = { ...cachedAlreadySetCols, ...this.record })
    },

    unsetColumn(column: string) {
      delete this.record[column]
      return this.record
    },

    resetRecord() {
      return (this.record = {})
    },

    async getAll(orderBy: null | string = null) {
      const { rows } = await postgres.query(
        `select * from ${table} ${orderBy || ''}`
      )
      return rows
    },

    // Uses AND logic between columns
    // Ex. keyValuePairs = { col1: 'val1', col2: 'col2', ... }
    async getAllBy(
      keyValuePairs: StringMap,
      pagination: any = null,
      orderBy: null | string = null
    ) {
      const columnAry: string[] = Object.keys(keyValuePairs)
      const paramsAry: any[] = []
      const filters: string[] = columnAry.map((col, ind) => {
        if (keyValuePairs[col] == null) return `${col} is null`

        paramsAry.push(keyValuePairs[col])

        // If the value is an array, we want to effectively use OR logic and
        // get any records that have any of the values and not all of them
        if (keyValuePairs[col] instanceof Array)
          return `${col} = ANY($${ind + 1})`

        return `${col} = $${ind + 1}`
      })
      const filterString: string = filters.join(' AND ')
      const query: string = `select * from ${table} where ${filterString}`
      const finalQuery: string = `${query} ${
        orderBy && orderBy.length > 0 ? orderBy : ''
      }`

      if (typeof pagination === 'object' && pagination != null) {
        return await PostgresSqlParser().runPaginationQuery(
          postgres,
          finalQuery,
          paramsAry,
          pagination.page,
          pagination.pageSize || 100
        )
      }

      const { rows } = await postgres.query(finalQuery, paramsAry)
      return rows
    },

    async find(id: number | string): Promise<null | StringMap> {
      return await this.findBy({ id })
    },

    // Uses AND logic between columns
    // Ex. keyValuePairs = { col1: 'val1', col2: 'col2', ... }
    async findBy(keyValuePairs: StringMap): Promise<null | StringMap> {
      const rows: object[] = await this.getAllBy(keyValuePairs)
      if (rows.length > 0) return rows[0]
      return null
    },

    // Ex. keyValuePairs = { col1: 'val1', col2: 'col2', ... }
    async findOrCreateBy(keyValuePairs: StringMap) {
      const check = await this.findBy(keyValuePairs)
      if (check) return (this.record = check)

      this.isNewRecord = true
      this.record = this.setRecord(keyValuePairs, true) // TODO: Should we restrict this to nonrestricted cols?
      const curId: boolean | number | string = await this.save()
      const newId: boolean | number | string = this.record.id
        ? this.record.id
        : curId
      this.record = Object.assign(this.record, { id: newId })
      return this.record
    },

    // Ex. keyValuePairs = { col1: 'val1', col2: 'col2', ... }
    async updateOrCreateBy(keyValuePairs: StringMap) {
      const currentRecord: object = Object.assign({}, this.record)
      const returnedRecord: null | object = await this.findBy(keyValuePairs)
      this.record = Object.assign(
        returnedRecord || {},
        currentRecord,
        keyValuePairs
      )

      await this.save()
      return this.record
    },

    async save(
      uniqueColumnIfNoId: string = '',
      sanitizeStrings: boolean = true
    ): Promise<boolean | number | string> {
      const keysInRecord: string[] = Object.keys(this.record)
      if (keysInRecord.length > 0) {
        let queryAry: string[],
          paramsAry: any[] = [],
          paramIndTracker: number = 1

        if (this.callbacks && typeof this.callbacks.beforeSave === 'function')
          await this.callbacks.beforeSave.call(this)

        if (this.record.id) {
          queryAry = [`update ${table} set`]

          keysInRecord.forEach((key) => {
            if (this.accessibleColumns.indexOf(key) === -1) return

            queryAry.push(`${key} = $${paramIndTracker},`)
            paramsAry.push(
              this._getSanitizedValue(this.record[key], sanitizeStrings)
            )
            paramIndTracker++
          })
          if (paramsAry.length === 0) return false

          queryAry.push(`updated_at = now()`)
          queryAry.push(`where id = $${paramIndTracker}`)
          paramsAry.push(this.record.id)

          const queryString = queryAry.join(' ')
          await postgres.query(queryString, paramsAry)

          if (this.callbacks && typeof this.callbacks.afterSave === 'function')
            await this.callbacks.afterSave.call(this)

          return this.record.id
        } else if (uniqueColumnIfNoId && this.record[uniqueColumnIfNoId]) {
          const currentRecord = Object.assign({}, this.record)
          const uniqueKey: string = uniqueColumnIfNoId as string
          await this.findOrCreateBy({
            [uniqueKey]: this.record[uniqueColumnIfNoId],
          })
          this.record = Object.assign(this.record, currentRecord)
          return await this.save()
        } else {
          // insert new record
          queryAry = [`insert into ${table} (`]
          let paramList: string[] = []

          keysInRecord.forEach((key) => {
            if (!this.accessibleColumns.includes(key)) return

            queryAry.push(`${key},`)
            paramList.push(`$${paramIndTracker}`)
            paramsAry.push(
              this._getSanitizedValue(this.record[key], sanitizeStrings)
            )
            paramIndTracker++
          })

          queryAry.push(
            `created_at, updated_at) values (${paramList.join(
              ','
            )}, now(), now()) returning id`
          )
          const qs = queryAry.join(' ')
          const { rows } = await postgres.query(qs, paramsAry)

          if (rows.length > 0) {
            this.setRecord({ id: rows[0].id })

            if (
              this.callbacks &&
              typeof this.callbacks.afterSave === 'function'
            )
              await this.callbacks.afterSave.call(this)

            this.isNewRecord = true
            return rows[0].id
          }
        }
      }
      return false
    },

    // Creates and executes a properly escaped 'INSERT INTO ...' query
    // from an arrayOfObjects where the object contains key/val pairs
    // of columns/values to be inserted with one query
    // Found from: https://github.com/brianc/node-postgres/issues/957#issuecomment-200000070
    async saveMany(arrayOfObjects: object[]) {
      if (arrayOfObjects.length === 0) return

      const columns = Object.keys(arrayOfObjects[0])
      const query = `INSERT INTO ${table} (${columns.join(',')}) VALUES %L`
      const values = arrayOfObjects.map((obj) => Object.values(obj))
      return await postgres.query(pgFormat(query, values))
    },

    async delete() {
      if (this.record && this.record.id) {
        const query = `delete from ${table} where id = $1`
        const params = [this.record.id]
        await postgres.query(query, params)
        return true
      }

      return false
    },

    sanitizeHtmlString(value: any) {
      const sanitizeOptions = getSantizeHtmlOptions()
      // const updatedValue = (value || '').replace(/\&amp\;/g, `&`)
      //   .replace(/\&gt\;/g, `>`)
      //   .replace(/\&lt\;/g, `<`)
      return sanitizeHtml(value, sanitizeOptions)
    },
  }
}

// https://www.npmjs.com/package/sanitize-html#what-are-the-default-options
function getSantizeHtmlOptions() {
  const allowedTags = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'p',
    'a',
    'ul',
    'ol',
    'nl',
    'li',
    'b',
    'i',
    'u',
    'strong',
    'em',
    'strike',
    'code',
    'hr',
    'br',
    'div',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'iframe',
    'span',
    's',
    'img',
  ]
  const allowedSchemes = ['data', 'http', 'https', 'ftp', 'mailto']
  const allowedAttributes = {
    '*': ['class', 'data-*', 'style'],
    a: ['href', 'name', 'target'],
    // We don't currently allow img itself by default, but this
    // would make sense if we did. You could add srcset here,
    // and if you do the URL is checked for safety
    img: ['src'],
  }

  return { allowedTags, allowedSchemes, allowedAttributes }
}
