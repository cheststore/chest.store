import FileManagement from '../libs/FileManagement'
import AuditLog from '../libs/models/AuditLog'
import CloudCredentials from '../libs/models/CloudCredentials'
import CloudCredentialUserMap from '../libs/models/CloudCredentialUserMap'

const Routes = require('../libs/Routes').default
const SessionHandler = require('../libs/SessionHandler').default

export default function ({ log, postgres, redis }: IFactoryOptions): StringMap {
  const fileMgmt = FileManagement()
  return {
    formidable: true, // support file uploads
    priority: 0,
    verb: 'POST',
    route: '/gcp/creds',
    handler: [
      Routes().requireAuthExpressMiddleware({ postgres, redis }),
      async function GcpCreds(req: any, res: any): Promise<void> {
        const session = SessionHandler(req.session)
        const creds = CloudCredentials(postgres)
        const userId = session.getLoggedInUserId()

        try {
          const file: any = Object.values(req.files)[0]
          const fileData = await fileMgmt.getLocalFile(file.path, 'utf-8')
          let fileJsObj = null
          try {
            fileJsObj = JSON.parse(fileData.toString())
          } catch (err) {
            log.error(`GCP cred file parse error`, err)
            return res.status(400).json({
              error: `There was an error parsing your GCP file. Please make sure its the JSON download and try again.`,
            })
          }

          await creds.findOrCreateBy({
            type: 'gcp',
            key: fileJsObj.client_email,
          })
          creds.setRecord({
            secret: fileJsObj.private_key,
            extra: fileJsObj,
          })

          await Promise.all([
            creds.save(),

            CloudCredentialUserMap(postgres).findOrCreateBy({
              credential_id: creds.record.id,
              user_id: userId,
            }),

            AuditLog(postgres).log({
              credential_id: creds.record.id,
              user_id: userId,
              entity_table: 'cloud_credentials',
              entity_id: creds.record.id,
              action: `Add GCP credential`,
              additional_info: { client_email: fileJsObj.client_email },
            }),
          ])

          res.json(creds.record)
        } catch (err) {
          res.status(500).json(err.message)
          log.error(err)
        }
      },
    ],
  }
}
