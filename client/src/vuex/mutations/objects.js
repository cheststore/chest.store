export default {
  SET_BUCKET_OBJECT_LIST_PAGE(state, page) {
    state.objects.currentList.currentPage = page
  },

  SET_BUCKET_OBJECT_LIST_PER_PAGE(state, perPage) {
    state.objects.currentList.perPage = perPage
  },

  SOCKET_SET_BUCKET_OBJECT_LIST(state, info) {
    state.objects.currentList = info
  },

  SET_BUCKET_OBJECT_FILTER(state, { key, value }) {
    state.objects.currentListFilters[key] = value
  },

  SET_BUCKET_CURRENT_DIRECTORY(state, dirObj) {
    state.objects.currentDirectory = dirObj
  },

  SET_BUCKET_DIRECTORIES(state, directories) {
    state.objects.directories = directories
  },

  SET_BUCKET_OBJECT(state, info) {
    state.objects.currentObject = {
      ...state.objects.currentObject,
      ...info,
    }
  },

  SET_BUCKET_OBJECT_HISTORY(state, history) {
    state.objects.currentObjectHistory = history
  },

  SET_INCLUDE_ALL_BUCKETS(state, bool) {
    state.objects.includeAllBuckets = bool
  },
}
