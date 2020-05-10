import { insertQuery, truncateTable } from './Helpers'

export async function createUser(postgres, additionalFields={}, teamIdForMap=null) {
  const info = await postgres.query(insertQuery('users', {
    name: 'theadmin',
    username: 'admin',
    ...additionalFields
  }))
  return info
}

export async function truncateUsers(postgres) {
  await truncateTable(postgres, 'users')
}
