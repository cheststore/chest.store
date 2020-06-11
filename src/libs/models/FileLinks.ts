import DatabaseModel from './DatabaseModel'

export default function FileLinks(postgres: any): IModel {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'file_links')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'bucket_id',
      'entity_table',
      'entity_id',
      'entity_identifying_info',
      'expiration_date',
      'password',
    ],
  })
}
