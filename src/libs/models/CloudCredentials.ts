import DatabaseModel from './DatabaseModel'

export default function CloudCredentials(postgres: any): IModel {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_credentials')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'type', // 'aws', 'gcp', etc.
      'key',
      'secret',
    ],

    async getAllForUser(userId: number | string) {
      const { rows } = await postgres.query(
        `
        select c.*
        from cloud_credentials as c
        inner join cloud_credential_user_map as m on m.credential_id = c.id
        where m.user_id = $1
        order by c.created_at
      `,
        [userId]
      )
      return rows
    },
  })
}
