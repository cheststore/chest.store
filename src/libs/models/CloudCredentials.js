import DatabaseModel from './DatabaseModel'

export default function CloudCredentials(postgres) {
  const factoryToExtend = DatabaseModel(postgres, 'cloud_credentials')

  return Object.assign(
    factoryToExtend,
    {
      accessibleColumns: [
        'type', // 'aws', 'gcp', etc.
        'key',
        'secret'
      ]
    }
  )
}
