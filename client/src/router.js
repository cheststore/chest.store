import Vue from 'vue'
import Router from 'vue-router'
import DashboardLayout from '@/layout/DashboardLayout'
import AuthLayout from '@/layout/AuthLayout'
Vue.use(Router)

export default new Router({
  mode: 'history',
  linkExactActiveClass: 'active',
  routes: [
    {
      path: '/',
      redirect: '/bucket',
      component: DashboardLayout,
      children: [
        {
          path: '/profile',
          name: 'userprofile',
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/UserSettings.vue'),
        },
        {
          path: '/repos',
          name: 'repolist',
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/GitRepoList.vue'),
        },
        {
          path: '/repo/:id',
          name: 'repodirlist',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/GitRepoDirList.vue'),
        },
        {
          path: '/repo/:id/file/*',
          name: 'repofile',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/GitFileDetail.vue'),
        },
        {
          path: '/repo/:id/*',
          name: 'repodirlistsub',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/GitRepoDirList.vue'),
        },
        {
          path: '/object/:objectId',
          name: 'object',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/FileDetail.vue'),
        },
        {
          path: '/directory',
          name: 'directorylistroot',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/FileList.vue'),
        },
        {
          path: '/directory/:directoryId',
          name: 'directorylist',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/FileList.vue'),
        },
        {
          path: '/bucket',
          name: 'bucketlist',
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/FileList.vue'),
        },
      ],
    },
    {
      path: '/',
      redirect: '/account/login',
      component: AuthLayout,
      children: [
        {
          path: '/account/:type',
          name: 'authenticate',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/Login.vue'),
        },
        {
          path: '/autherror/:error',
          name: 'autherror',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/Login.vue'),
        },
        {
          path: '/cred/init',
          name: 'initializecredential',
          component: () =>
            import(
              /* webpackChunkName: "demo" */ './views/AddProvider/AddProviderView.vue'
            ),
        },
        {
          path: '*',
          name: 'authenticatefallback',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/Login.vue'),
        },
      ],
    },
  ],
})
