import DatabaseModel from './DatabaseModel'

const PostgresSqlParser = require('../PostgresSqlParser').default

export default function AuditLog(postgres: any): IModel {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'audit_log')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'credential_id',
      'user_id',
      'entity_table',
      'entity_id',
      'action',
      'ip_address',
      'additional_info',
    ],

    async log({
      credential_id,
      user_id,
      entity_table,
      entity_id,
      action,
      ip_address,
      additional_info,
    }: StringMap): Promise<number | string> {
      const self = this as any
      self.resetRecord()
      self.setRecord({
        credential_id,
        user_id,
        entity_table,
        entity_id,
        action,
        ip_address,
        additional_info,
      })
      return await self.save()
    },

    async getLogs(
      userId: number | string,
      page: number = 1,
      pageSize: number = 30,
      filters: null | StringMap = null
    ) {
      let filterQuery: string[] = []
      let filterParams: string[] = []
      if (filters) {
        Object.keys(filters).forEach((column) => {
          filterParams.push(filters[column])
          filterQuery.push(`${column} = $${filterParams.length + 2}`)
        })
      }

      const query: string = `
          select *
          from audit_log
          where
            user_id = $2
            ${filterQuery.length > 0 ? `and ${filterQuery.join(` and `)}` : ''}
          order by created_at desc`
      const params: (number | string)[] = [userId].concat(filterParams)

      return await PostgresSqlParser().runPaginationQuery(
        postgres,
        query,
        params,
        page,
        pageSize
      )
    },
  })
}
