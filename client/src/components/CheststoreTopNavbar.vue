<template lang="pug">
  nav.py-2.navbar.navbar-expand-lg.navbar-light.bg-light
    router-link.navbar-brand(to='/') #[i.fa.fa-treasure-chest] chest.store
    button.navbar-toggler(
      type='button',
      data-toggle='collapse',
      data-target='#navbar-supported-content',
      aria-controls='navbar-supported-content',
      aria-expanded='false',
      aria-label='Toggle navigation')
      span.navbar-toggler-icon
    div#navbar-supported-content.collapse.navbar-collapse
      ul.navbar-nav.mr-auto
        //- li.nav-item.active
        //-   router-link.nav-link(to='/')
        //-     | Home 
        //-     span.sr-only (current)
      div.d-flex.align-items-center.justify-content-center(v-if="isLoggedIn")
        ul.navbar-nav
          //- li.nav-item.border-left.border-right.text-center
          //-   router-link.py-0.nav-link(to="/account")
          //-     div.text-small ACCOUNT
          //-     div {{ username || 'N/A' }}
          //- li.nav-item.border-right.text-center
          //-   router-link.py-0.nav-link(to="/history")
          //-     div.text-small BALANCE
          //-     div $0.00
          li.nav-item
            a.nav-link(href='/logout') Logout

</template>

<script>
  import { mapState } from 'vuex'

  export default {
    computed: mapState({
      isLoggedIn: state => state.isLoggedIn,
      username: state => state.session && state.session.user && state.session.user.username,
      userType: state => state.session && state.session.user && state.session.user.user_type
    })
  }
</script>

<style lang="scss" scoped>
  .navbar {
    padding: 0rem;

    .navbar-brand {
      padding-left: 1rem;
    }

    ul.navbar-nav {
      li.nav-item {
        padding: 0.5rem 1rem;
      }
    }
  }
</style>