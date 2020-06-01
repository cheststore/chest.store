<template lang="pug">
  div.card.bg-secondary.shadow.border-0
    div.card-header.border-0
      h3.m-0 Enter GCP Information
    div.card-body.py-lg-3.px-lg-5
      div.small.mb-3
        | In order to integrate with your GCP storage account and bucket(s),
        | you need to upload the service account JSON file downloadable from 
        | the GCP console, where the service account is used to authenticate and
        | make requests to sync to your bucket(s) of choice.
      div
        div(v-if="savedCred")
          label Email of service account
          div
            strong {{ savedCred.key }}
        file-uploader(
          v-else
          size="sm"
          url="/gcp/creds"
          :remove-after-upload="true"
          @added="createdCredential"
          @error="errorCreatingCreds")
      template(v-if="savedCred")
        hr
        div.form-group
          label(for="all-gcp-buckets") Select Bucket
          select#all-gcp-buckets.form-control(v-model="selectedBucketName",@change="selectBucket")
            option(v-for="bucket in buckets",:value="bucket.id") {{ bucket.name }}

</template>

<script>
  // import { mapState } from 'vuex'
  import ApiProviders from '../../factories/ApiProviders'

  export default {
    data() {
      return {
        awsKey: null,
        awsSecret: null,

        buckets: [],
        selectedBucketName: null,
        savedCred: null,
      }
    },

    methods: {
      errorCreatingCreds([, err]) {
        return this.$notify({
          type: 'danger',
          message: err.error || err.message,
        })
      },

      async createdCredential([, res]) {
        this.savedCred = res
        await this.listBuckets()
      },

      async selectBucket() {
        try {
          if (!this.selectedBucketName)
            return this.$notify({
              type: 'danger',
              message: `Please enter a valid bucket to integrate with.`,
            })

          await ApiProviders.saveBucket(
            this.selectedBucketName,
            this.savedCred.id
          )
          await this.$store.dispatch('getUserSession', true)
          this.$emit('created')
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },

      async listBuckets() {
        try {
          const [data] = await ApiProviders.listBuckets(this.savedCred.id)
          this.buckets = data
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },
  }
</script>
