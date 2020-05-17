<template lang="pug">
  div.row.justify-content-center
    div.col-lg-5.col-md-7
      form(@submit="checkAndSaveAwsKeys")
        div.card.bg-secondary.shadow.border-0
          div.card-header.border-0
            h3.m-0 Enter AWS Access Key
          div.card-body.py-lg-3.px-lg-5
            div.small.mb-3
              | In order to integrate with your AWS account and S3 bucket(s),
              | you need to enter a valid AWS Access Key and Secret we will
              | use to make API requests to sync your S3 bucket information.
            base-input.input-group-alternative(
              v-model="awsKey"
              placeholder="AWS Access Key"
              :disabled="hasCred")
            template(v-if="!hasCred")
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
                label(for="all-buckets") Select Bucket
                select#all-buckets.form-control(v-model="selectedBucketName",@change="selectBucket")
                  option(v-for="bucket in buckets",:value="bucket.Name") {{ bucket.Name }}

</template>

<script>
  import { mapState } from 'vuex'
  import ApiAws from '../factories/ApiAws'

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
            return this.$notify({ type: 'danger', message: `Please enter both and access key and secret to add.` })

          this.isCheckingKey = true
          await ApiAws.checkAndSaveKey('aws', this.computedKey, this.awsSecret)
          await Promise.all([
            this.$store.dispatch('getUserSession', true),
            this.listBuckets()
          ])

        } catch(err) {
          this.$notify({ type: 'danger', message: err.message })
        } finally {
          this.isCheckingKey = false
        }
      },

      async selectBucket() {
        try {
          if (!this.selectedBucketName)
            return this.$notify({ type: 'danger', message: `Please enter a valid bucket to integrate with.` })

          await ApiAws.saveBucket(this.selectedBucketName)
          await this.$store.dispatch('getUserSession', true)
          this.$router.push('/')

        } catch(err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },

      async listBuckets() {
        try {
          const { Buckets } = await ApiAws.listBuckets()
          this.buckets = Buckets

        } catch(err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      }
    },

    async created() {
      if (this.hasCred)
        await this.listBuckets()
    }
  }
</script>
