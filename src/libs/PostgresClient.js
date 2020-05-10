import { Pool } from 'pg'
import QueryStream from 'pg-query-stream'
import config from '../config'

const NOOP = ()=>{}

export default class PostgresClient {
  constructor(connStrOrConfig=config.postgres.connectionString, additionalConfig={}) {
    if (typeof connStrOrConfig === 'string') {
      let connConfig = { connectionString: connStrOrConfig }

      // https://github.com/brianc/node-postgres/issues/2009#issuecomment-608568254
      if (config.server.isProduction)
        connConfig.ssl = { rejectUnauthorized: false }

      this.pool = new Pool(connConfig)
    } else {
      this.pool = new Pool({
        host:               connStrOrConfig.host,
        user:               connStrOrConfig.user,
        password:           connStrOrConfig.password,
        database:           connStrOrConfig.database,
        ssl:                connStrOrConfig.ssl,
        max:                additionalConfig.max || 2,    // max number of clients in the pool
        idleTimeoutMillis:  5000 // how long a client is allowed to remain idle before being closed
      })
    }

    this.logger = additionalConfig.logger || additionalConfig.log || {
      fatal:    console.log,
      critical: console.log,
      error:    console.log,
      info:     NOOP,
      debug:    NOOP
    }

    this.bindPoolErrorEvent()
  }

  async query(...args) {
    let query = args[0]
    let values = args[1]

    this.logger.debug(`PostgresClient#query`, query, values)

    if (values)
      return await this.pool.query(query, values)

    return await this.pool.query(query)
  }

  queryStream(query, ...args) {
    return new Promise(async (resolve, reject) => {
      let client
      try {
        client = await this.pool.connect()

        let values = []
        let individualCallback = NOOP
        switch (args.length) {
          case 2:
            values = args[0]
            individualCallback = args[1]
            break
          case 1:
            individualCallback = args[0]
            break
        }

        this.logger.debug(`PostgresClient#queryStream`, query, values)

        const queryStream = new QueryStream(query, values)
        const stream = client.query(queryStream)

        stream.on('data', individualCallback)

        stream.on('error', err => {
          stream.pause()
          client.release()
          reject(err)
        })

        stream.on('end', function() {
          client.release()
          resolve()
        })

      } catch(err) {
        client.release()
        reject(err)
      }
    })
  }

  bindPoolErrorEvent() {
    this.pool.on('error', (err, client) => {
      // if an error is encountered by a client while it sits idle in the pool
      // the pool itself will emit an error event with both the error and
      // the client which emitted the original error
      // this is a rare occurrence but can happen if there is a network partition
      // between your application and the database, the database restarts, etc.
      // and so you might want to handle it and at least log it out
      this.logger.error('idle client error', err.message, err.stack, client)
    })
  }

  close() {
    this.pool.end()
  }

  async dropTableCascadeAndDropDependentTables(tableName) {
    const { rows } = await this.query(`
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = $1 AND ccu.table_name = $2
    `, [ 'FOREIGN KEY', tableName ])

    // check and drop any dependent tables before dropping this table
    let tablesDropped = []
    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        const dependentInfo = rows[i]

        // if there's a foreign key to itself, ignore it
        if (dependentInfo.table_name === tableName)
          continue

        const localTables = await this.dropTableCascadeAndDropDependentTables(dependentInfo.table_name)
        tablesDropped = tablesDropped.concat(localTables)
      }
    }

    try {
      await this.query(`drop table ${tableName}`)
    } finally {
      return [ ...new Set(tablesDropped.flat(Infinity).concat([ tableName ])) ]
    }
  }

  async addColumnIfNotExists(table, column, columnType, defaultValue=null) {
    await this.query(`
      DO $$
          BEGIN
              BEGIN
                  ALTER TABLE ${table} ADD COLUMN ${column} ${columnType} ${defaultValue || ''};
              EXCEPTION
                  WHEN duplicate_column THEN RAISE NOTICE 'column ${column} already exists in ${table}.';
              END;
          END;
      $$
    `)
  }

  async updateConstraintWithoutException(updateConstraintSql) {
    updateConstraintSql = updateConstraintSql.replace(/\n|\r\n/g, '').replace(';', '')

    await this.query(`
      DO $$
          BEGIN
              BEGIN
                  ${updateConstraintSql};
              EXCEPTION
                  WHEN duplicate_object THEN RAISE NOTICE 'constraint already exists: ${updateConstraintSql}';
                  WHEN duplicate_table THEN RAISE NOTICE 'constraint already exists: ${updateConstraintSql}';
                  WHEN undefined_object THEN RAISE NOTICE 'constraint does not exist: ${updateConstraintSql}';
                  WHEN undefined_table THEN RAISE NOTICE 'constraint does not exist: ${updateConstraintSql}';
              END;
          END;
      $$
    `)
  }
}
