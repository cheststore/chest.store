import DatabaseModel from './DatabaseModel'

export default function UserApiKeys(postgres: any): IModel {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'user_api_keys')

  return Object.assign(factoryToExtend, {
    accessibleColumns: ['credential_id', 'bucket_id', 'user_id', 'key'],
  })
}
