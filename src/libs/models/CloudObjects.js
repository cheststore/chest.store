import DatabaseModel from './DatabaseModel'
import PostgresSqlParser from '../PostgresSqlParser'

export default function CloudObjects(postgres) {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_objects')

  return Object.assign(
    factoryToExtend,
    {
      accessibleColumns: [
        'bucket_id',
        'full_path',
        'name',
        'last_modified',
        'etag',
        'size_bytes',
        'storage_class',
        'owner_id',
        'owner_display_name',
        'sha256_contents',
        'metadata'
      ],

      async getObjectsInBucket(
        bucketId,
        page=1,
        perPage=30
      ) {
        return await PostgresSqlParser().runPaginationQuery(postgres, `
          select o.*
          from cloud_objects as o
          where bucket_id = $1
          order by o.last_modified desc
        `, [ bucketId ], page, perPage)
      }
    }
  )
}
