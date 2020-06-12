import DatabaseModel from './DatabaseModel'

export default function CloudBuckets(postgres: any) {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'cloud_buckets')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'credential_id',
      'type',
      'bucket_uid',
      'prefix',
      'name',
      'description',
    ],

    async getAllForUser(userId: string, id?: string): Promise<StringMap[]> {
      const { rows } = await postgres.query(
        `
          select b.*
          from cloud_bucket_user_map as m
          inner join cloud_buckets as b on b.id = m.bucket_id
          where m.user_id = $1
          ${id ? `and b.id = $2` : ''}
          order by b.created_at
        `,
        [userId].concat(id ? [id] : [])
      )
      return rows
    },
  })
}
