import DatabaseModel from './DatabaseModel'

export default function CloudBucketUserMap(postgres) {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_bucket_user_map')

  return Object.assign(
    factoryToExtend,
    {
      accessibleColumns: [
        'bucket_id',
        'user_id'
      ]
    }
  )
}
