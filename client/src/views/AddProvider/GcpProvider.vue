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
        template(v-else)
          select-credential.mt-2.mb-3(
            type="gcp",
            @input="selectExisting")
          file-uploader(
            size="sm"
            url="/gcp/creds"
            :remove-after-upload="true"
            @added="createdCredential"
            @error="errorCreatingCreds")
      template(v-if="savedCred")
        hr
        div.form-group
          label(for="all-gcp-buckets") Select Bucket
          select#all-gcp-buckets.form-control(v-model="selectedBucketName")
            option(v-for="bucket in buckets",:value="bucket.id") {{ bucket.name }}
        template(v-if="selectedBucketName")
            div.form-group
              label Subdirectory to filter files #[i.fa.fa-info-circle(:id="`aws-prov-prefix-${_uid}`")]
              b-tooltip(:target="`aws-prov-prefix-${_uid}`")
                | If you would like to sync objects from a bucket but only a particular subdirectory
                | inside the bucket, you can enter a prefix here and we'll only sync objects in
                | this subdirectory and all child directories.
                | <strong>NOTE: Be careful about including leading slashes as this is treated differently than a prefix without the leading slash.</strong>
              input.form-control(
                placeholder="Bucket directory prefix (i.e. 'example/dir')...",
                v-model="selectBucketPrefix")

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
        selectBucketPrefix: null,
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

      async selectExisting(cred) {
        this.awsKey = cred.key
        this.awsSecret = cred.secret
        await this.checkAndSaveAwsKeys()
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
            this.savedCred.id,
            this.selectBucketPrefix
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
