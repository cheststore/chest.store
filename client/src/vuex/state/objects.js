export default {
  objects: {
    includeAllBuckets: true,
    directories: [],
    currentDirectory: {},
    currentObject: {},
    currentObjectHistory: {
      all: [],
      latest: {},
      total: 0,
      initialized: false,
    },

    currentListFilters: {
      searchQuery: null,
    },
    currentList: {
      currentPage: 1,
      data: [],
      numberPages: 1,
      perPage: 10,
      totalCount: 0,
    },
  },
}
