export default {
  SET_BUCKET_GITREPO_LIST_PAGE(state, page) {
    state.gitrepos.currentList.currentPage = page
  },

  SET_BUCKET_GITREPO_LIST_PER_PAGE(state, perPage) {
    state.gitrepos.currentList.perPage = perPage
  },

  SET_GITREPO(state, repoObj) {
    state.gitrepos.currentRepo = repoObj
  },

  SET_GITREPO_FILES(state, dirsAndFiles) {
    state.gitrepos.currentRepo = {
      ...state.gitrepos.currentRepo,
      files: dirsAndFiles,
    }
  },

  SET_GITREPO_DIRPATH(state, path) {
    state.gitrepos.currentRepoDirpath = path
  },

  SET_GITREPO_FILE(state, fileObj) {
    state.gitrepos.currentFile = fileObj
  },

  SOCKET_SET_BUCKET_GITREPO_LIST(state, info) {
    state.gitrepos.currentList = info
  },
}
