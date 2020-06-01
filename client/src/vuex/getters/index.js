export default {
  routeNamespace(state) {
    return state.router.currentRoute.fullPath.split('/')[1]
  },

  getActiveProviderTypes(state) {
    const types = state.providerTypes
    const appHasDropbox = state.oauthBindings && state.oauthBindings.dropbox
    return types.filter((t) => {
      return t.value !== 'dropbox' || appHasDropbox
    })
  },

  dropboxOauthCred(state) {
    const appHasDropbox = state.oauthBindings && state.oauthBindings.dropbox
    return (
      appHasDropbox &&
      Object.values(state.session.credentials).find((t) => t.type === 'dropbox')
    )
  },
}
