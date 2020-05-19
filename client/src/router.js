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
      path: '/account',
      redirect: 'account/login',
      component: AuthLayout,
      children: [
        {
          path: ':type',
          name: 'account',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/Login.vue'),
        },
      ],
    },
    {
      path: '/aws/init',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'AWS Init',
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/InitAws.vue'),
        },
      ],
    },
    {
      path: '/autherror',
      component: AuthLayout,
      children: [
        {
          path: ':error',
          name: 'autherror',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/Login.vue'),
        },
      ],
    },
    {
      path: '/',
      redirect: 'bucket',
      component: DashboardLayout,
      children: [
        {
          path: '/directory/:directoryId',
          props: true,
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/FileList.vue'),
        },
        {
          path: '*',
          component: () =>
            import(/* webpackChunkName: "demo" */ './views/FileList.vue'),
        },
      ],
    },
  ],
})
