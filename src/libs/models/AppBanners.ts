import DatabaseModel from './DatabaseModel'

export default function AppBanners(postgres: any): IModel {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'app_banners')

  return Object.assign(factoryToExtend, {
    accessibleColumns: ['banner_html', 'is_active', 'priority'],
  })
}
