import CheststoreFetch from './CheststoreFetch'
import { handleFetchResponse } from './ApiHelpers'

export default {
  async listBuckets() {
    const response = await CheststoreFetch(`/api/1.0/aws/buckets/list`)
    return await handleFetchResponse(response)
  },

  async checkAndSaveKey(awsKey, awsSecret) {
    const response = await CheststoreFetch(`/api/1.0/aws/key/check/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ awsKey, awsSecret })
    })
    return await handleFetchResponse(response)
  },

  async saveBucket(bucketName) {
    const response = await CheststoreFetch(`/api/1.0/aws/bucket/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: bucketName })
    })
    return await handleFetchResponse(response)
  },

  async syncCurrentBucket() {
    const response = await CheststoreFetch(`/api/1.0/aws/bucket/sync`)
    return await handleFetchResponse(response)
  }
}
