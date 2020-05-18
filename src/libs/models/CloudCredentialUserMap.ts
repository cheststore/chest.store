import DatabaseModel from './DatabaseModel'

export default function CloudCredentialUserMap(postgres: any): IModel {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_credential_user_map')

  return Object.assign(factoryToExtend, {
    accessibleColumns: ['credential_id', 'user_id'],
  })
}
