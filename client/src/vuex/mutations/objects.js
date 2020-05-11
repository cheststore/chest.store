export default {
  SET_OBJECT_LIST_PAGE(state, page) {
    state.objects.currentList.currentPage = page
  },

  SET_OBJECT_LIST_PER_PAGE(state, perPage) {
    state.objects.currentList.perPage = perPage
  },

  SET_OBJECT_LIST(state, info) {
    state.objects.currentList = info
  },

  SET_OBJECT(state, info) {
    state.objects.currentObject = {
      ...state.objects.currentObject,
      ...info
    }
  }
}
