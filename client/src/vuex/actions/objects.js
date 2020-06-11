import ApiCloudObjects from '../../factories/ApiCloudObjects'

export default {
  async SOCKET_getObjectsList(
    { commit, state },
    { bucketId = null, directoryId = null } = {}
  ) {
    const {
      objectInfo,
      directory,
      directories,
    } = await ApiCloudObjects.listObjects(
      bucketId ||
        (state.objects.currentObject && state.objects.currentObject.id),
      directoryId,
      state.objects.currentListFilters,
      state.objects.currentList.currentPage,
      state.objects.currentList.perPage
    )

    commit('SOCKET_SET_BUCKET_OBJECT_LIST', objectInfo)
    commit('SET_BUCKET_CURRENT_DIRECTORY', directory)
    commit('SET_BUCKET_DIRECTORIES', directories)
  },

  async getCurrentObject({ commit, state }) {
    const { object, directory } = await ApiCloudObjects.getObjectDetail(
      state.objects.currentObject.id
    )
    commit('SET_BUCKET_OBJECT', object)
    commit('SET_BUCKET_CURRENT_DIRECTORY', directory)
  },

  async getCurrentObjHistory({ commit, state }) {
    const { history } = await ApiCloudObjects.getObjectHistory(
      state.objects.currentObject.id
    )
    commit('SET_BUCKET_OBJECT_HISTORY', history)
  },
}
