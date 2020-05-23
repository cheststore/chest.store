import DatabaseModel from './DatabaseModel'

export default function ProviderTypes(postgres: any): IModel {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'provider_types')

  return Object.assign(factoryToExtend, {
    accessibleColumns: ['value', 'text', 'is_active'],
  })
}
