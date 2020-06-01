import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async getOauthBindings() {
    const response = await CheststoreFetch(`/api/1.0/global/oauth/bindings/get`)
    return await handleFetchResponse(response)
  },
}
