import Objects from './objects'

export default {
  ...Objects,

  APP_NO_LONGER_LOADING(state) {
    state.isLoading = false
  },

  SET_INIT_PROCESSING(state, isProcessing = false) {
    state.isInitProcessing = isProcessing
  },

  CHECK_LOGGED_IN(state, isLoggedIn) {
    state.isLoggedIn = isLoggedIn
  },

  SET_ROUTE(state, newPath) {
    state.router.push(newPath)
  },

  SET_OAUTH_BINDINGS(state, bindings) {
    state.oauthBindings = bindings
  },

  SET_SESSION(state, sessionObj) {
    state.session = sessionObj
  },

  SET_USER_KEY(state, { key, value }) {
    state.session.user = {
      ...state.session.user,
      [key]: value,
    }
  },

  SET_USER_API_KEYS(state, keys) {
    state.userApiKeys = keys
  },

  SET_PROVIDER_TYPES(state, types) {
    state.providerTypes = types
  },

  SOCKET_SET_MAIN_NOTIFICATION(state, notification) {
    state.mainNotification = notification
  },
}
