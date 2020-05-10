<template lang="pug">
  div
    div.row.mb-4
      div.col-lg-12.d-flex.align-items-center
        div.text-gray
          | #[strong {{ objectInfo.totalCount }}] objects
          | in #[strong {{ currentBucket.name }}]
        button.ml-auto.btn.btn-vsm.btn-primary(@click="syncBucket()") Sync Bucket

    pagination.mb-3(
      :info="objectInfo",
      @changePage="changePage",
      @changePerPage="changePerPage")
    div.row.small-gutters
      div.col-md-6.col-lg-3.mb-2(v-for="obj in objectInfo.data")
        div.card.card-small.no-shadow.border.rounded-0
          div.card-body.py-2.px-3
            div.small.text-soft.d-flex.align-items-center.text-gray
              div.overflow-ellipses.no-hover.small {{ obj.full_path }}
              div.ml-auto.nowrap.small
                div.ml-2.small.text-right
                  strong {{ getFormattedDate(obj.last_modified) }}
            div.mt-2.d-flex.align-items-center
              div.overflow-ellipses.no-hover(:id="`object-${obj.id}`")
                a(@click="downloadObject(obj.id)") {{ obj.name }}
                b-tooltip(:target="`object-${obj.id}`") {{ obj.name }}
              div.ml-auto.nowrap
                div.ml-2.small.text-gray {{ humanFileSize(obj.size_bytes) }}
    pagination.mt-1(
      :info="objectInfo",
      @changePage="changePage",
      @changePerPage="changePerPage")
</template>

<script>
  import { mapState } from 'vuex'
  import ApiAws from '../../factories/ApiAws'
  import DomHelpers from '../../factories/DomHelpers'
  import StringHelpers from '../../factories/StringHelpers'
  import TimeHelpers from '../../factories/TimeHelpers'

  export default {
    computed: {
      ...mapState({
        currentBucket: state => state.session.current_bucket,
        objectInfo: state => state.objects.currentList
      })
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,

      downloadObject(objId) {
        DomHelpers.downloadUri(`/file/download/${objId}`)
      },

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
        } catch(err) {
          window.toastr.error(err.message)
        }
      }
    },

    async created() {
      await this.getObjectList()
    }
  }
</script>