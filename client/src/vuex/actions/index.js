import Objects from './objects'

import ApiAuth from '../../factories/ApiAuth'
import ApiProviders from '../../factories/ApiProviders'

export default {
  ...Objects,

  async init({ commit, dispatch, state }) {
    // state.isInitProcessing is a flag that prevents this `init` action
    // from dispatching more than once at a time. currently init is dispatched
    // on root component create and when route changes occur which could
    // overlap.
    if (state.isInitProcessing) return

    try {
      commit('SET_INIT_PROCESSING', true)

      await Promise.all([
        dispatch('getUserApiKeys'),
        dispatch('getUserSession'),
        dispatch('getProviderTypes'),
      ])

      // Seeing a weird bug where the currentRoute.fullPath shows
      // as the root route, then populates as the correct route.
      const fullPath = window.location.pathname // state.router.currentRoute.fullPath

      const isLoggedIn = !!state.session.user
      commit('CHECK_LOGGED_IN', isLoggedIn)
      if (isLoggedIn) {
        if (!state.session.current_credential) {
          const path = '/cred/init'
          if (fullPath !== path) return state.router.push(path)
        }

        if (/^\/account/.test(fullPath)) {
          return (window.location.href = '/') // return commit('SET_ROUTE', '/')
        }
      } else {
        if (
          !(
            /^\/account/.test(fullPath) ||
            /^\/autherror/.test(fullPath) ||
            /^\/mfa/.test(fullPath)
          )
        ) {
          return commit('SET_ROUTE', '/account/login')
        }
      }
    } finally {
      commit('APP_NO_LONGER_LOADING')
      commit('SET_INIT_PROCESSING', false)
    }
  },

  async getUserApiKeys({ commit, state }, reset = false) {
    if (state.userApiKeys.length > 0 && !reset) return

    const { keys } = await ApiAuth.getApiKeys()
    commit('SET_USER_API_KEYS', keys)
  },

  async getUserSession({ commit, state }, reset = false) {
    if (state.session && state.session.user && !reset)
      return { session: state.session }

    const { session } = await ApiAuth.getSession()
    commit('SET_SESSION', session)
  },

  async getProviderTypes({ commit, state }, reset = false) {
    if (state.providerTypes.length > 0 && !reset) return

    const { types } = await ApiProviders.getTypes()
    commit('SET_PROVIDER_TYPES', types)
  },
}
