import DatabaseModel from './DatabaseModel'

export default function UserApiKeys(postgres: any): IModel {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'user_api_keys')

  return Object.assign(factoryToExtend, {
    accessibleColumns: ['user_id', 'is_active', 'key'],
  })
}
