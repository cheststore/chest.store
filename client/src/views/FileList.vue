<template lang="pug">
  div
    base-header.pb-6.pb-8.pt-5.pt-md-8(type="gradient-info")
      div.row
        div.col-lg-12.d-flex.align-items-center
          h2.text-white.mb-0 #[strong {{ objectInfo.totalCount }}] objects in #[strong {{ dirOrBucket }}]
          base-button.ml-auto(type="warning",@click="syncBucket()") Sync Bucket Manually

    div.container.mt--7
      div.row
        div.col-lg-3.mb-4
          div.card.shadow
            div.card-header.border-0
              h6.mb-0 Bucket Directories
            div.table-responsive.mb-0
              base-table.table.align-items-center.table-flush(
                thead-classes="thead-light"
                tbody-classes="list"
                no-data-placeholder="No directories at this level..."
                :data="directories")
                template(slot="columns")
                  th.py-1 Directory
                template(slot-scope="{row}")
                  td.py-1
                    router-link.text-primary.small(:to="`/directory/${row.id}`") {{ row.full_path }}
        div.col.mb-4
          div.card.shadow
            div.card-header.border-0
              h3.mb-0 {{ dirOrBucket == '/' ? currentBucket.name : dirOrBucket }} objects
            div.table-responsive.mb-0
              base-table.table.align-items-center.table-flush(
                thead-classes="thead-light"
                tbody-classes="list"
                :no-data-placeholder="`No objects in ${dirOrBucket}`"
                :data="objectInfo.data")
                template(slot="columns")
                  th Object
                  th Size
                  th Last Modified
                  th
                template(slot-scope="{row}")
                  th(scope="row")
                    router-link(:to="`/object/${row.id}`") {{ row.full_path }}
                  td {{ humanFileSize(row.size_bytes) }}
                  td {{ getFormattedDate(row.last_modified) }}
                  td
                    base-dropdown.dropdown(position="right")
                      a(slot="title")
                        i.fa.fa-ellipsis-h
                      template
                        a.dropdown-item(@click="downloadObject(row.id)") Download Object
            div.card-footer.d-flex.justify-content-end
              base-pagination.mb-0(
                :total="objectInfo.totalCount"
                :value="objectInfo.currentPage"
                :perPage="objectInfo.perPage"
                @input="changePage")
</template>

<script>
  import { mapState } from 'vuex'
  import DomHelpers from '../factories/DomHelpers'
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'
  import ApiAws from '../factories/ApiAws'

  export default {
    props: {
      directoryId: { type: String, default: null }
    },

    watch: {
      async directoryId() {
        await this.changePage(1)
      }
    },

    computed: {
      ...mapState({
        currentDir: state => state.objects.currentDirectory,
        currentParentDirId: state => state.objects.currentDirectory && state.objects.currentDirectory.parent_directory_id,
        currentBucket: state => state.session.current_bucket,
        objectInfo: state => state.objects.currentList,

        directories(state) {
          return this.directoryId != null
            ? [{ full_path: '..', id: this.currentParentDirId || '' }].concat(state.objects.directories)
            : state.objects.directories
        },
      }),

      dirOrBucket() {
        return this.currentDir ? `/${this.currentDir.full_path}` : '/'
      }
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,

      downloadObject(objId) {
        DomHelpers.downloadUri(`/file/download/${objId}`)
      },

      async changePage(newPage) {
        this.$store.commit('SET_BUCKET_OBJECT_LIST_PAGE', newPage)
        await this.getObjectList()
      },

      async changePerPage(newPerPage) {
        this.$store.commit('SET_BUCKET_OBJECT_LIST_PER_PAGE', newPerPage)
        this.$store.commit('SET_BUCKET_OBJECT_LIST_PAGE', 1)
        await this.getObjectList()
      },

      async getObjectList() {
        await this.$store.dispatch('getObjectsList', this.directoryId)
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
    }
  }
</script>