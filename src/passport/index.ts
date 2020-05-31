import Local from './local'
import Dropbox from './dropbox'
import CloudCredentials from '../libs/models/CloudCredentials'
import CloudCredentialUserMap from '../libs/models/CloudCredentialUserMap'
import UserOauthTokens from '../libs/models/UserOauthTokens'

// import SessionHandler from '../libs/SessionHandler'
const SessionHandler = require('../libs/SessionHandler').default

export default function Strategies(opts: IFactoryOptions) {
  return {
    local: Local(opts),
    dropbox: Dropbox(opts),
  }
}

export async function oauthHandler({
  req,
  accessToken,
  refreshToken,
  profile,
  postgres,
  emailAddress,
  type,
  done,
}: any): Promise<void> {
  try {
    const creds = CloudCredentials(postgres)
    const credMap = CloudCredentialUserMap(postgres)
    const tokens = UserOauthTokens(postgres)
    const session = SessionHandler(req.session)
    const userId = session.getLoggedInUserId()

    await tokens.findOrCreateBy({
      user_id: userId,
      type: type,
      unique_id: profile.id,
    })
    tokens.setRecord({
      access_token: accessToken,
      refresh_token: refreshToken,
      email: emailAddress,
    })

    await Promise.all([
      tokens.save(),
      creds.findOrCreateBy({ type: 'dropbox', key: tokens.record.id }),
    ])

    creds.setRecord({
      secret: accessToken,
      extra: { refresh_token: refreshToken },
    })

    await Promise.all([
      creds.save(),
      credMap.findOrCreateBy({
        credential_id: creds.record.id,
        user_id: userId,
      }),
    ])

    done()
  } catch (err) {
    done(err)
  }
}
