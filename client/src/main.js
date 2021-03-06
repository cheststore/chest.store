// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
// import $ from 'jquery'
import 'bootstrap'
import * as FastClick from 'fastclick'
import VueLogger from 'vuejs-logger'
import VueSocketIO from 'vue-socket.io'
import store from './vuex/store'
import Cheststore from './Cheststore'
import VueHighlightJS from './directives/vue-highlightjs'
import Dashboard from './plugins/dashboard'
import CheststoreSocket from './factories/CheststoreSocket'
import router from './router'

// import './registerServiceWorker'

// css
import 'bootstrap-vue/dist/bootstrap-vue.css'
// import 'highlight.js/styles/default.css'
import 'highlight.js/styles/agate.css'
import './css/app.scss'

Vue.use(VueLogger, {
  isEnabled: true,
  logLevel: !window.webpackHotUpdate ? 'error' : 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: true,
  separator: '|',
  showConsoleColors: true,
})
Vue.use(VueHighlightJS)
Vue.use(
  new VueSocketIO({
    debug: window.webpackHotUpdate,
    connection: CheststoreSocket,
    vuex: {
      store,
      actionPrefix: 'SOCKET_',
      mutationPrefix: 'SOCKET_',
    },
  })
)
Vue.use(Dashboard)

// Initiate FastClick for mobile devices to remove the built-in 300ms
// delay. Read more in https://github.com/ftlabs/fastclick
if ('addEventListener' in document) {
  document.addEventListener(
    'DOMContentLoaded',
    () => FastClick.attach(document.body),
    false
  )
}

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  store,
  el: '#cheststore',
  router,
  template: '<Cheststore/>',
  components: { Cheststore },
})
