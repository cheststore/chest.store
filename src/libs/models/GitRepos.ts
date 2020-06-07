import DatabaseModel from './DatabaseModel'

const PostgresSqlParser = require('../PostgresSqlParser').default

export default function GitRepos(postgres: any): IModel {
  const factoryToExtend = DatabaseModel(postgres, 'git_repos')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'credential_id',
      'bucket_id',
      'object_id',
      'user_id',
      'repo',
      'is_object_version_repo',
      'version_source_object_id',
    ],

    async getReposInBucket(
      bucketId: string[],
      page: number = 1,
      perPage: number = 30
    ) {
      return await PostgresSqlParser().runPaginationQuery(
        postgres,
        `
          select
            b.type as bucket_type,
            b.name as bucket_name,
            o.*,
            r.*
          from git_repos as r
          inner join cloud_objects as o on o.id = r.object_id
          inner join cloud_buckets as b on b.id = r.bucket_id
          where
            r.bucket_id = ANY($1) and
            r.is_object_version_repo is not true
          order by lower(r.repo)
        `,
        [bucketId],
        page,
        perPage
      )
    },
  })
}
