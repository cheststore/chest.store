import path from 'path'
import bunyan from 'bunyan'
import requireAll from 'require-all'
import PostgresClient from '../libs/PostgresClient'
import config from '../config'

const log = bunyan.createLogger(config.logger.options)

export default async function runMigrations(postgresUrl) {
  try {
    console.log("URL", typeof postgresUrl, postgresUrl)
    const postgres = new PostgresClient(postgresUrl)
    const allMigrations = migrations()

    for (let _i = 0; _i < allMigrations.length; _i++) {
      const migrationFunction = allMigrations[_i]
      log.debug(`Running migration function`, migrationFunction)
      await migrationFunction(postgres)
    }

    log.info("Successfully ran DB migrations!")

  } catch(err) {
    log.error("Error running DB migrations", err)
  }
}

export function migrations() {
  const allMigrations = requireAll(path.join(__dirname, 'migrations'))
  return Object.keys(allMigrations)
  .sort((file1, file2) => parseFloat(file1) - parseFloat(file2))
  .map(key => allMigrations[key].default)
  .flat(Infinity)
}
