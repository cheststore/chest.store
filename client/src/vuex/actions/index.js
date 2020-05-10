import Objects from './objects'

import ApiAuth from '../../factories/ApiAuth'

export default {
  ...Objects,

  async init({ commit, dispatch, state }) {
    // state.isInitProcessing is a flag that prevents this `init` action
    // from dispatching more than once at a time. currently init is dispatched
    // on root component create and when route changes occur which could
    // overlap.
    if (state.isInitProcessing)
      return

    try {
      commit('SET_INIT_PROCESSING', true)

      await dispatch('getUserSession')

      const fullPath = state.router.currentRoute.fullPath
      const isLoggedIn = !!(state.session.user)
      commit('CHECK_LOGGED_IN', isLoggedIn)
      if (isLoggedIn) {
        if (!state.session.current_credential) {
          const path = '/aws/init'
          if (fullPath !== path)
            return state.router.push(path)
        }
        
        if (/^\/login/.test(fullPath)) {
          return window.location.href = '/' // return commit('SET_ROUTE', '/')
        }
      } else {
        if (!(/^\/login/.test(fullPath) || /^\/autherror/.test(fullPath) || /^\/mfa/.test(fullPath))) {
          commit('SET_ROUTE', '/login')
        }
      }

    } finally {
      commit('APP_NO_LONGER_LOADING')
      commit('SET_INIT_PROCESSING', false)
    }
  },

  async getUserSession({ commit, state }, reset=false) {
    if (state.session && state.session.user && !reset)
      return { session: state.session }

    const { session } = await ApiAuth.getSession()
    commit('SET_SESSION', session)
  },

  SOCKET_mainNotification({ commit }, notification) {
    commit('SET_MAIN_NOTIFICATION', notification)
  }
}
