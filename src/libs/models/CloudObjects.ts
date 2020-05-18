import DatabaseModel from './DatabaseModel'

const PostgresSqlParser = require('../PostgresSqlParser').default

export default function CloudObjects(postgres: any): IModel {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_objects')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'bucket_id',
      'full_path',
      'directory_id', // null means top level of bucket
      'name',
      'last_modified',
      'etag',
      'size_bytes',
      'storage_class',
      'owner_id',
      'owner_display_name',
      'sha256_contents',
      'metadata',
    ],

    async getObjectsInBucket(
      bucketId: number | string,
      directoryId: number | string | null = null,
      page: number = 1,
      perPage: number = 30
    ): Promise<StringMap[]> {
      let filters: string[] = [`bucket_id = $1`]
      let params: (number | string)[] = [bucketId]
      if (directoryId) {
        filters.push(`directory_id = $2`)
        params.push(directoryId)
      } else {
        filters.push(`directory_id is null`)
      }

      return await PostgresSqlParser().runPaginationQuery(
        postgres,
        `
          select o.*
          from cloud_objects as o
          where ${filters.join(' and ')}
          order by o.last_modified desc
        `,
        params,
        page,
        perPage
      )
    },
  })
}
