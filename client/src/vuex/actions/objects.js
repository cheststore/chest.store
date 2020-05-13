import ApiCloudObjects from '../../factories/ApiCloudObjects'

export default {
  async getObjectsList({ commit, state }, directoryId=null) {
    const { objectInfo, directory, directories } = await ApiCloudObjects.listObjects(
      directoryId,
      state.objects.currentList.currentPage,
      state.objects.currentList.perPage)

    commit('SET_BUCKET_OBJECT_LIST', objectInfo)
    commit('SET_BUCKET_CURRENT_DIRECTORY', directory)
    commit('SET_BUCKET_DIRECTORIES', directories)
  },

  async getCurrentObject({ commit, state }) {
    const { object } = await ApiCloudObjects.getObjectDetail(state.objects.currentObject.id)
    commit('SET_BUCKET_OBJECT', object)
  }
}
