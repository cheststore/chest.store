<template lang="pug">
  div#app.container-fluid.h-100
    div.main-navbar.sticky-top.bg-white.row
      cheststore-top-navbar.w-100
      div.w-100.alert.alert-danger.text-center.rounded-0.mb-0(
        v-if="mainNotification",
        v-html="mainNotification")
    div.container.mt-4
      loader(v-if="isLoading")
      router-view#main-content.mb-4(v-else)

    reset-password-modal(@reset="resetSession")
</template>

<script>
  import { mapState } from 'vuex'
  import $ from 'jquery'
  import CheststoreTopNavbar from './CheststoreTopNavbar'
  import ResetPasswordModal from './auth/ResetPasswordModal'

  export default {
    name: 'cheststore',

    computed: mapState({
      isLoading: state => state.isLoading,
      mainNotification: state => state.mainNotification,
      user: state => state.session.user
    }),

    watch: {
      async $route(/*to, from*/) {
        this.$socket.emit('globalUpdatePagePath', this.$router.currentRoute.fullPath)
        await this.$store.dispatch('init')
      }
    },

    methods: {
      async resetSession() {
        await this.$store.dispatch('getUserSession', true)
      }
    },

    async created() {
      await this.$store.dispatch('init')

      if (this.user && this.user.needs_password_reset)
        $("#reset-password-modal").modal()

      this.$socket.emit('globalSubscribe', this.$router.currentRoute.fullPath)
    },

    components: {
      CheststoreTopNavbar,
      ResetPasswordModal
    }
  }
</script>