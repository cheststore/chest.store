import Objects from './objects'

export default {
  ...Objects,

  isLoading: true,
  isLoggedIn: false,
  isInitProcessing: false,
  mainNotification: null,
  oauthBindings: null,
  pageSizes: [10, 15, 20, 25, 50, 100],

  session: {},
  userApiKeys: [],
  providerTypes: [],

  getRowNumber(index, currentPage = 1, perPage = 20) {
    return perPage * (currentPage - 1) + (index + 1)
  },

  getBucket(bucketId) {
    const state = this
    const bucket = state.session.buckets.find((b) => b.id === bucketId)
    if (!bucket) return {}
    return {
      ...state.providerTypes.find((t) => t.value === bucket.type),
      ...bucket,
    }
  },
}
