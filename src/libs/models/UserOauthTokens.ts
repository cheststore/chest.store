import DatabaseModel from './DatabaseModel'

export default function UserOauthTokens(postgres: any): IModel {
  const factoryToExtend: IModel = DatabaseModel(postgres, 'user_oauth_tokens')

  return Object.assign(factoryToExtend, {
    accessibleColumns: [
      'user_id',
      'type',
      'unique_id',
      'access_token',
      'refresh_token',
      'first_name',
      'last_name',
      'email',
      'expires',
      'mod1',
    ],
  })
}
