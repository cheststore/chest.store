import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async getAllRepos(bucketId = null, page = 1, perPage = 30) {
    const response = await CheststoreFetch(
      `/api/1.0/gitrepos/all?bucketId=${bucketId || ''}&page=${page ||
        1}&perPage=${perPage || 30}`
    )
    return await handleFetchResponse(response)
  },

  async getRepoAndDir(repoId, dirPath = null) {
    const response = await CheststoreFetch(
      `/api/1.0/gitrepos/get?id=${repoId}&path=${(dirPath &&
        encodeURIComponent(dirPath)) ||
        ''}`
    )
    return await handleFetchResponse(response)
  },

  async getFile(repoId, filePath) {
    const response = await CheststoreFetch(
      `/api/1.0/gitrepos/file/get?id=${repoId}&path=${encodeURIComponent(
        filePath
      )}`
    )
    return await handleFetchResponse(response)
  },
}
