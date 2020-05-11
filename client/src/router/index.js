import Vue from 'vue'
import VueRouter from 'vue-router'

const AuthError = () => import('@/components/auth/AuthError')
const InitAws = () => import('@/components/aws/InitAws')
const FileDetail = () => import('@/components/aws/FileDetail')
const FileList = () => import('@/components/aws/FileList')
const Login = () => import('@/components/auth/Login')

Vue.use(VueRouter)

export default new VueRouter({
  mode: 'history',
  routes: getRoutes().map(r => ({
    path: r.path,
    component: r.component,
    props: r.props
  }))
})

export function getRoutes() {
  return [
    {
      path: '/object/:id',
      component: FileDetail,
      props: true,
      title: 'File/Object Detail',
      subTitle: 'chest.store'
    },
    {
      path: '/aws/init',
      component: InitAws,
      title: 'AWS Access Information',
      subTitle: 'chest.store'
    },
    {
      path: '/login',
      component: Login,
      title: 'Login/Create Account',
      subTitle: 'chest.store'
    },
    {
      path: '/autherror/:error',
      component: AuthError,
      props: true,
      title: 'Login/Create Account',
      subTitle: 'chest.store'
    },
    {
      path: '/*',
      component: FileList,
      title: 'chest.store',
      subTitle: 'chest.store'
    }
  ]
}
