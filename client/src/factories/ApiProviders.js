import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async getTypes() {
    const response = await CheststoreFetch(`/api/1.0/providers/types`)
    return await handleFetchResponse(response)
  },

  async syncCurrentBucket() {
    const response = await CheststoreFetch(`/api/1.0/providers/bucket/sync`)
    return await handleFetchResponse(response)
  },

  async checkAndSaveFsDir(dir) {
    const response = await CheststoreFetch(`/api/1.0/providers/fs/checkdir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir }),
    })
    return await handleFetchResponse(response)
  },
}
