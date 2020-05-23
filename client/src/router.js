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
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/UserProfile.vue'),
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
              /* webpackChunkName: "demo" */ './views/AddProvider/AddProvider.vue'
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
