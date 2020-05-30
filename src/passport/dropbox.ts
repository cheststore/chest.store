// import { passportOauthLoginHandler } from '../libs/Helpers'
import { oauthHandler } from './index'
import config from '../config'

const PassportDropbox = require('passport-dropbox-oauth2')
const DropboxStrategy = PassportDropbox.Strategy

export default function DropboxPassportStrategy({ postgres }: IFactoryOptions) {
  return {
    name: 'dropbox',
    strategy: DropboxStrategy,
    options: {
      apiVersion: '2',
      clientID: config.dropbox.appId,
      clientSecret: config.dropbox.appSecret,
      callbackURL: config.dropbox.loginCallbackUrl,
      passReqToCallback: true,
    },
    bindCondition() {
      return !!this.options.clientID
    },
    handler: async function DropboxPassportHandler(
      req: StringMap,
      accessToken: string,
      refreshToken: string,
      profile: StringMap,
      done: (err?: null | undefined | Error, res?: any) => void
    ) {
      try {
        const emailAddress: string = profile.emails[0].value
        await oauthHandler({
          req,
          accessToken,
          refreshToken,
          profile,
          postgres,
          emailAddress,
          type: 'dropbox',
          done,
        })
      } catch (err) {
        done(err)
      }
    },
  }
}
