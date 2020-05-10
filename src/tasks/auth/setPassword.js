import minimist from 'minimist'
import PostgresClient from '../../libs/PostgresClient'
import Users from '../../libs/models/Users'
import config from '../../config'

const argv = minimist(process.argv.slice(2))
const username = argv.u || argv.username
const pw = argv.p || argv.password

const postgres = new PostgresClient()

;(async function setPassword() {
  try {
    const users = Users(postgres)
    const userRecord = await users.findBy({ username })
    if (!userRecord)
      throw new Error(`No user found with username: ${username}`)

    const hashedPw = await users.hashPassword(pw)
    users.setRecord({
      id: userRecord.id,
      // needs_password_reset: true,
      password_hash: hashedPw
    }, true)
    await users.save()

    console.log(`Successfully set password for user ${username}!`)
  } catch(err) {
    console.error(`Error setPassword`, err)
  } finally {
    process.exit()
  }
})()
