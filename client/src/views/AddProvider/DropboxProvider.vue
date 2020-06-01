<template lang="pug">
  div.card.bg-secondary.shadow.border-0
    div.card-header.border-0
      h3.m-0 Dropbox Directory
    div.card-body.py-lg-3.px-lg-5
      div(v-if="!dropboxOauthCred")
        base-alert.d-flex.flex-column.align-items-center(type="danger")
          div.mb-3 You need to authenticate with Dropbox in order to sync with a Dropbox directory.
          a(href="/auth/dropbox")
            base-button.d-flex.align-items-center(type="secondary",text-color="black")
              span.avatar-sm.mr-2
                img.img-fluid(src="/public/img/vendors/dropbox_logo.png")
              div Authenticate with Dropbox
      template(v-else)
        div.small.mb-3
          | Select the Dropbox base directory for chest.store to sync with, which
          | will serve as the top level directory chest.store will sync.
        div.form-group
          label(for="all-gcp-buckets") Select Directory
          select#all-gcp-buckets.form-control(v-model="baseDir",@change="checkAndSaveDirectory")
            option(v-for="bucket in buckets",:value="bucket.path_lower") {{ bucket.path_display }}

</template>

<script>
  import { mapState } from 'vuex'
  import ApiProviders from '../../factories/ApiProviders'

  export default {
    data() {
      return {
        baseDir: null,
        buckets: [],
      }
    },

    computed: mapState({
      dropboxOauthCred: (_, getters) => getters.dropboxOauthCred,
    }),

    watch: {
      async ['dropboxOauthCred.id'](credId) {
        if (credId) await this.listBuckets()
      },
    },

    methods: {
      async listBuckets() {
        try {
          const info = await ApiProviders.listBuckets(this.dropboxOauthCred.id)
          this.buckets = info
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },

      async checkAndSaveDirectory() {
        try {
          if (!this.baseDir)
            return this.$notify({
              type: 'danger',
              message: `Please enter a valid bucket to integrate with.`,
            })

          await ApiProviders.saveBucket(this.baseDir, this.dropboxOauthCred.id)
          await this.$store.dispatch('getUserSession', true)
          this.$emit('created')
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },

    async created() {
      if (this.dropboxOauthCred && this.dropboxOauthCred.id)
        await this.listBuckets()
    },
  }
</script>
