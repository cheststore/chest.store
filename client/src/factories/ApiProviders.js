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

  async listBuckets(id) {
    const response = await CheststoreFetch(`/api/1.0/aws/buckets/list?id=${id}`)
    return await handleFetchResponse(response)
  },

  async checkAndSaveKey(providerType, awsKey, awsSecret) {
    const response = await CheststoreFetch(`/api/1.0/aws/key/check/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerType, awsKey, awsSecret }),
    })
    return await handleFetchResponse(response)
  },

  async saveBucket(bucketName, credentialId) {
    const response = await CheststoreFetch(`/api/1.0/aws/bucket/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId, bucket: bucketName }),
    })
    return await handleFetchResponse(response)
  },
}
