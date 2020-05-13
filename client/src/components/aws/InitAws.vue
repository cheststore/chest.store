<template lang="pug">
  div.row
    div.col-lg-4.offset-lg-4
      form(@submit="checkAndSaveAwsKeys")
        div.card.no-shadow
          div.card-header.border-0
            h3.m-0 Enter your AWS Access Key
          div.card-body
            div.small.mb-3
              | In order to integrate with your AWS account and S3 bucket(s),
              | you need to enter a valid AWS Access Key and Secret we will
              | use to make API requests to sync your S3 bucket information.
            div.form-group
              label(for="aws-key") AWS Access Key
              template(v-if="!hasCred")
                input#aws-key.form-control(v-model="awsKey")
              div(v-else)
                strong {{ computedKey }}
            template(v-if="!hasCred")
              div.form-group
                  label(for="aws-secret") AWS Access Secret
                  input#aws-secret.form-control(type="password",v-model="awsSecret")
              div.form-group.d-flex.justify-content-center
                button.btn.btn-primary(v-if="!isCheckingKey") Add Key
                loader(v-else)
            template(v-if="hasCred")
              hr
              div.form-group
                label(for="all-buckets") Select Bucket
                select#all-buckets.form-control(v-model="selectedBucketName",@change="selectBucket")
                  option(v-for="bucket in buckets",:value="bucket.Name") {{ bucket.Name }}

</template>

<script>
  import { mapState } from 'vuex'
  import ApiAws from '../../factories/ApiAws'

  export default {
    data() {
      return {
        isCheckingKey: false,
        awsKey: null,
        awsSecret: null,

        buckets: [],
        selectedBucketName: null
      }
    },

    computed: {
      ...mapState({
        hasCred: state => state.session.current_credential
      }),

      computedKey() {
        return (this.hasCred && this.hasCred.key) || this.awsKey
      }
    },

    methods: {
      async checkAndSaveAwsKeys(evt) {
        try {
          evt.preventDefault()

          if (!(this.computedKey && this.awsSecret))
            return window.toastr.error(`Please enter both and access key and secret to add.`)

          this.isCheckingKey = true
          await ApiAws.checkAndSaveKey('aws', this.computedKey, this.awsSecret)
          await Promise.all([
            this.$store.dispatch('getUserSession', true),
            this.listBuckets()
          ])

        } catch(err) {
          window.toastr.error(err.message)
        } finally {
          this.isCheckingKey = false
        }
      },

      async selectBucket() {
        try {
          if (!this.selectedBucketName)
            return window.toastr.error(`Please enter a valid bucket to integrate with.`)

          await ApiAws.saveBucket(this.selectedBucketName)
          await this.$store.dispatch('getUserSession', true)
          this.$router.push('/')

        } catch(err) {
          window.toastr.error(err.message)
        }
      },

      async listBuckets() {
        try {
          const { Buckets } = await ApiAws.listBuckets()
          this.buckets = Buckets

        } catch(err) {
          window.toastr.error(err.message)
        }
      }
    },

    async created() {
      if (this.hasCred)
        await this.listBuckets()
    }
  }
</script>
