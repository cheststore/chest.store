import DatabaseModel from './DatabaseModel'

export default function GitRepos(postgres: any): IModel {
  const factoryToExtend = DatabaseModel(postgres, 'git_repos')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'credential_id',
      'bucket_id',
      'object_id',
      'user_id',
      'repo',
    ],
  })
}
