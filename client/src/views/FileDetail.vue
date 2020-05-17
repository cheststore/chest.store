<template lang="pug">
  div
    loader(v-if="isLoadingLocal")
    div(v-else)
      h3.m-0
        a(@click="downloadObject") {{ file.name }}
</template>

<script>
  import { mapState } from 'vuex'
  // import ApiFiles from '../../factories/ApiFiles'
  import DomHelpers from '../../factories/DomHelpers'

  export default {
    props: {
      id: { type: [ Number, String ], required: true }
    },

    watch: {
      async id(newId) {
        await this.getObject(newId)
      }
    },
    
    data() {
      return {
        isLoadingLocal: true
      }
    },

    computed: {
      ...mapState({
        currentBucket: state => state.session.current_bucket,
        file: state => state.objects.currentObject
      })
    },

    methods: {
      downloadObject() {
        DomHelpers.downloadUri(`/file/download/${this.id}`)
      },

      async getObject(id=this.id) {
        try {
          this.isLoadingLocal = true
          this.$store.commit('SET_BUCKET_OBJECT', { id })
          await this.$store.dispatch('getCurrentObject')
        } catch(err) {
          this.$notify({ type: 'danger', message: err.message })
        } finally {
          this.isLoadingLocal = false
        }
      }
    },

    async created() {
      await this.getObject()
    }
  }
</script>