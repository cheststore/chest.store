<template lang="pug">
  form(@submit="checkAndSaveAwsKeys")
    div.card.bg-secondary.shadow.border-0
      div.card-header.border-0
        h3.m-0 Enter AWS Access Information
      div.card-body.py-lg-3.px-lg-5
        div.small.mb-3
          | In order to integrate with your AWS account and S3 bucket(s),
          | you need to enter a valid AWS Access Key and Secret we will
          | use to make API requests to sync your S3 bucket information.
        select-credential.mt-2.mb-3(
          type="aws",
          @input="selectExisting")
        base-input.input-group-alternative(
          v-model="awsKey"
          placeholder="AWS Access Key"
          :disabled="savedCredKey")
        template(v-if="!savedCredKey")
          base-input.input-group-alternative(
            v-model="awsSecret"
            placeholder="AWS Access Secret",
            type="password")
          div.form-group.d-flex.justify-content-center
            base-button(
              v-if="!isCheckingKey"
              type="primary"
              native-type="submit") Add Key
            loader(v-else)
        template(v-else)
          hr
          div.form-group
            label(for="all-buckets") Select Bucket#[sup.text-danger *]
            select#all-buckets.form-control(v-model="selectedBucketName")
              option(v-for="bucket in buckets",:value="bucket.Name") {{ bucket.Name }}
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
            div.form-group.d-flex.justify-content-center
              base-button(type="success",@click="selectBucket") Save Bucket

</template>

<script>
  // import { mapState } from 'vuex'
  import ApiProviders from '../../factories/ApiProviders'

  export default {
    data() {
      return {
        isCheckingKey: false,
        awsKey: null,
        awsSecret: null,

        buckets: [],
        selectedBucketName: null,
        selectBucketPrefix: null,
        savedCredKey: null,
      }
    },

    methods: {
      async selectExisting(cred) {
        this.awsKey = cred.key
        this.awsSecret = cred.secret
        await this.checkAndSaveAwsKeys()
      },

      async checkAndSaveAwsKeys(evt) {
        try {
          if (evt) evt.preventDefault()

          if (!(this.awsKey && this.awsSecret))
            return this.$notify({
              type: 'danger',
              message: `Please enter both and access key and secret to add.`,
            })

          this.isCheckingKey = true
          const { id } = await ApiProviders.checkAndSaveKey(
            'aws',
            this.awsKey,
            this.awsSecret
          )
          this.credentialId = id
          await Promise.all([
            this.$store.dispatch('getUserSession', true),
            this.listBuckets(),
          ])
          this.savedCredKey = this.awsKey
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        } finally {
          this.isCheckingKey = false
        }
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
            this.credentialId,
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
          const { Buckets } = await ApiProviders.listBuckets(this.credentialId)
          this.buckets = Buckets
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },
  }
</script>
