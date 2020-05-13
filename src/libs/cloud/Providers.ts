import { IFactoryOptions } from './ProviderTypes'
import AwsProvider from './AwsProvider'

export default function Providers(type: string, options: IFactoryOptions) {
  switch(type.toLowerCase()) {
    case 'aws':
      return AwsProvider(options)
    default:
      throw new Error(`Invalid provider type.`)
  }
}