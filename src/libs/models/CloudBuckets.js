import DatabaseModel from './DatabaseModel'

export default function CloudBuckets(postgres) {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_buckets')

  return Object.assign(
    factoryToExtend,
    {
      accessibleColumns: [
        'type',
        'bucket_uid',
        'name',
        'description'
      ],

      async getAllForUser(userId) {
        const { rows } = await postgres.query(`
          select b.*
          from cloud_bucket_user_map as m
          inner join cloud_buckets as b on b.id = m.bucket_id
          where m.user_id = $1
          order by b.created_at
        `, [ userId ])
        return rows
      }
    }
  )
}
