import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async listObjects(page=1, perPage=30) {
    const response = await CheststoreFetch(`/api/1.0/objects/list?page=${page || 1}&perPage=${perPage || 30}`)
    return await handleFetchResponse(response)
  },

  async getObjectDetail(id) {
    const response = await CheststoreFetch(`/api/1.0/objects/get?id=${id}`)
    return await handleFetchResponse(response)
  }
}
