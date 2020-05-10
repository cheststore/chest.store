import Objects from './objects'

export default {
  ...Objects,

  isLoading: true,
  isLoggedIn: false,
  isInitProcessing: false,
  mainNotification: null,
  pageSizes: [ 10, 15, 20, 25, 50, 100 ],
  
  session: {}
}
