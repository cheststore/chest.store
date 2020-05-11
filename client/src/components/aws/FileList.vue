<template lang="pug">
  div
    div.row.mb-4
      div.col-lg-12.d-flex.align-items-center
        button.ml-auto.btn.btn-vsm.btn-primary(@click="syncBucket()") Sync Bucket Manually

    ul.list-unstyled.object-list
      li.px-3.py-2(v-if="objectInfo.totalCount === 0")
        i No objects in bucket #[strong {{ currentBucket.name }}] yet
      li.px-3.py-2.border-bottom(v-else,v-for="(obj, index) in objectInfo.data")
        file-list-row(:file="obj",:ind="index")

    div.row
      div.d-none.col-md-6.d-md-flex.align-items-center
        div.text-gray
          | page #[strong {{ objectInfo.currentPage }}] of #[strong {{ objectInfo.numberPages }}]
          | (#[strong {{ objectInfo.totalCount }}] objects in #[strong {{ currentBucket.name }}])
      div.col-md-6
        pagination.mt-1(
          :info="objectInfo",
          @changePage="changePage",
          @changePerPage="changePerPage")
</template>

<script>
  import { mapState } from 'vuex'
  import FileListRow from './FileListRow'
  import ApiAws from '../../factories/ApiAws'

  export default {
    computed: {
      ...mapState({
        currentBucket: state => state.session.current_bucket,
        objectInfo: state => state.objects.currentList
      })
    },

    methods: {
      async changePage(newPage) {
        this.$store.commit('SET_OBJECT_LIST_PAGE', newPage)
        await this.getObjectList()
      },

      async changePerPage(newPerPage) {
        this.$store.commit('SET_OBJECT_LIST_PER_PAGE', newPerPage)
        this.$store.commit('SET_OBJECT_LIST_PAGE', 1)
        await this.getObjectList()
      },

      async getObjectList() {
        await this.$store.dispatch('getObjectsList')
      },
      
      async syncBucket() {
        try {
          await ApiAws.syncCurrentBucket()
          window.toastr.success(`Began syncing bucket! Any new objects should show up shortly.`)
        } catch(err) {
          window.toastr.error(err.message)
        }
      }
    },

    async created() {
      await this.getObjectList()
    },

    components: {
      FileListRow
    }
  }
</script>