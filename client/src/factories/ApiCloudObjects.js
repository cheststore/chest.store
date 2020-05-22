import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async downloadObjectBlob(objectId) {
    const response = await CheststoreFetch(`/file/download/${objectId}`)
    return await handleFetchResponse(response, 'blob')
  },

  async listObjects(
    directoryId = null,
    filters = null,
    page = 1,
    perPage = 30
  ) {
    const response = await CheststoreFetch(
      `/api/1.0/objects/list?directoryId=${directoryId ||
        ''}&filters=${encodeURIComponent(
        JSON.stringify(filters)
      )}&page=${page || 1}&perPage=${perPage || 30}`
    )
    return await handleFetchResponse(response)
  },

  async getObjectDetail(id) {
    const response = await CheststoreFetch(`/api/1.0/objects/get?id=${id}`)
    return await handleFetchResponse(response)
  },

  async getObjectHistory(id) {
    const response = await CheststoreFetch(
      `/api/1.0/objects/get/history?id=${id}`
    )
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
