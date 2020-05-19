import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async listObjects(directoryId = null, page = 1, perPage = 30) {
    const response = await CheststoreFetch(
      `/api/1.0/objects/list?directoryId=${directoryId || ''}&page=${page ||
        1}&perPage=${perPage || 30}`
    )
    return await handleFetchResponse(response)
  },

  async getObjectDetail(id) {
    const response = await CheststoreFetch(`/api/1.0/objects/get?id=${id}`)
    return await handleFetchResponse(response)
  },

  async deleteObject(id) {
    const response = await CheststoreFetch(`/api/1.0/objects/delete?id=${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      // body: JSON.stringify({ bucket: bucketName })
    })
    return await handleFetchResponse(response)
  },
}
