import DatabaseModel from './DatabaseModel'

const PostgresSqlParser = require('../PostgresSqlParser').default

export default function CloudObjects(postgres: any) {
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
      'is_deleted',
    ],

    async getHistoryObject(
      sourceObjectId: number | string
    ): Promise<StringMap> {
      const { rows } = await postgres.query(
        `
        select o.*
        from cloud_objects as o
        inner join git_repos as g on g.object_id = o.id 
        where
          g.is_object_version_repo is true and
          g.version_source_object_id = $1
      `,
        [sourceObjectId]
      )
      return rows[0]
    },

    async getObjectAndBucket(objectId: number | string): Promise<StringMap> {
      const { rows } = await postgres.query(
        `
        select
          b.*,
          o.*
        from cloud_objects as o
        inner join cloud_buckets as b on b.id = o.bucket_id
        where
          o.id = $1 -- and
          -- o.is_deleted is not true -- do we even need this check?
      `,
        [objectId]
      )
      return rows[0]
    },

    async getObjectsInBucket(
      bucketId: string[],
      directoryId: number | string | null = null,
      filters: null | StringMap,
      page: number = 1,
      perPage: number = 30
    ): Promise<StringMap[]> {
      let filterClauses: string[] = [`bucket_id = ANY($1)`]
      let params: any[] = [bucketId]

      // TODO: for now if there are filters present disregard the
      // directory ID. Probably should respect directory ID at
      // some point if it's provided.
      const hasFilterPresent =
        filters &&
        Object.keys(filters).reduce(
          (bool, val) => bool || !!filters[val],
          false
        )
      if (filters && hasFilterPresent) {
        if (filters.searchQuery) {
          filterClauses.push(`o.name ilike '%' || $${params.length + 1} || '%'`)
          params.push(filters.searchQuery)
        }
      } else {
        if (directoryId) {
          filterClauses.push(`directory_id = $${params.length + 1}`)
          params.push(directoryId)
        } else {
          filterClauses.push(`directory_id is null`)
        }
      }

      return await PostgresSqlParser().runPaginationQuery(
        postgres,
        `
          select o.*
          from cloud_objects as o
          where
            o.is_deleted is not true and
            ${filterClauses.join(' and ')}
          order by o.last_modified desc
        `,
        params,
        page,
        perPage
      )
    },
  })
}
