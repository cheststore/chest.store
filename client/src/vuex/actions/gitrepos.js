import ApiGitrepos from '../../factories/ApiGitrepos'

export default {
  async getGitRepoList({ commit, state }, { bucketId = null }) {
    const { repos } = await ApiGitrepos.getAllRepos(
      bucketId,
      state.gitrepos.currentList.currentPage,
      state.gitrepos.currentList.perPage
    )

    commit('SOCKET_SET_BUCKET_GITREPO_LIST', repos)
  },

  async getCurrentGitRepoDir({ commit }, { id, path }) {
    commit('SET_GITREPO', { id })
    commit('SET_GITREPO_DIRPATH', path)

    const { repo, files } = await ApiGitrepos.getRepoAndDir(id, path)
    commit('SET_GITREPO', repo)
    commit('SET_GITREPO_FILES', files)
  },

  async getCurrentGitRepoFile({ commit }, { id, path }) {
    commit('SET_GITREPO', { id })
    commit('SET_GITREPO_DIRPATH', path)
    const { file } = await ApiGitrepos.getFile(id, path)
    commit('SET_GITREPO_FILE', file)
  },
}
