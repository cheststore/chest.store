import DatabaseModel from './DatabaseModel'

export default function CloudCredentials(postgres: any): IModel {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_credentials')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'type', // 'aws', 'gcp', etc.
      'key',
      'secret',
    ],
  })
}
