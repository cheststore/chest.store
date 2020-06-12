<template>
  <div id="app">
    <base-alert
      v-if="mainBanner"
      class="m-0 py-2 rounded-0 text-center"
      type="danger"
      v-html="mainBanner"
    ></base-alert>
    <notifications></notifications>
    <loader v-if="isLoading"></loader>
    <router-view v-else />
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import $ from 'jquery'

  export default {
    name: 'cheststore',

    computed: mapState({
      isLoading: (state) => state.isLoading,
      mainBanner: (state) => state.mainBanner,
      user: (state) => state.session.user,
    }),

    watch: {
      async $route(/* to, from */) {
        this.$socket.emit(
          'globalUpdatePagePath',
          this.$router.currentRoute.fullPath
        )
        await this.$store.dispatch('init')
      },
    },

    methods: {
      async resetSession() {
        await this.$store.dispatch('getUserSession', true)
      },
    },

    async created() {
      await this.$store.dispatch('init')

      if (this.user && this.user.needs_password_reset)
        $('#reset-password-modal').modal()

      this.$socket.emit('globalSubscribe', this.$router.currentRoute.fullPath)
    },
  }
</script>
