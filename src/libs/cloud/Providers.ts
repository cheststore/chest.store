import { IFactoryOptions } from './ProviderTypes'

const AwsProvider = require('./AwsProvider.js')

export default function Providers(type: string, options: IFactoryOptions) {
  switch(type.toLowerCase()) {
    default: // 'aws'
      return AwsProvider(options)
  }
}