import ApiCloudObjects from '../../factories/ApiCloudObjects'

export default {
  async getObjectsList({ commit, state }) {
    const info = await ApiCloudObjects.listObjects(
      state.objects.currentList.currentPage,
      state.objects.currentList.perPage)

    commit('SET_OBJECT_LIST', info)
  }
}
