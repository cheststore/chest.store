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

  SET_SESSION(state, sessionObj) {
    state.session = sessionObj
  },

  SOCKET_SET_MAIN_NOTIFICATION(state, notification) {
    state.mainNotification = notification
  },
}
