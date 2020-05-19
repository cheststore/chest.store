<template lang="pug">
  div
    base-header.pb-6.pb-8.pt-5.pt-md-8(type="gradient-info")
      div.row
        div.col-lg-12.d-flex.align-items-center
          h2.text-white.mb-0 #[strong {{ objectInfo.totalCount }}] objects in #[strong {{ dirOrBucket }}]
          div.ml-auto.d-flex.align-items-center
            base-button(type="info",@click="syncBucket()") Sync Bucket Manually
            file-uploader(
              :remove-after-upload="true"
              :btn-only="true"
              :btn-text="`Add File to ${dirOrBucket}`"
              btn-variant="warning"
              @added="fileUploaded")

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
                    router-link(:to="`/object/${row.id}`")
                      div.d-flex.align-items-center
                        span.bg-white.avatar.avatar-sm.border.mr-2(v-if="isImage(row.full_path) && row.size_bytes < maxShowSize")
                          img(:src="`/file/download/${row.id}`")
                        div {{ row.full_path }}
                  td {{ humanFileSize(row.size_bytes) }}
                  td {{ getFormattedDate(row.last_modified) }}
                  td
                    base-dropdown.dropdown(position="right")
                      a(slot="title")
                        i.fa.fa-ellipsis-h
                      template
                        a.dropdown-item(@click="downloadObject(row.id)") Download Object
                        a.dropdown-item(@click="promptDeleteObject(row)") Delete Object
            div.card-footer.d-flex.justify-content-end
              base-pagination.mb-0(
                :total="objectInfo.totalCount"
                :value="objectInfo.currentPage"
                :perPage="objectInfo.perPage"
                @input="changePage")

    confirmation-modal(
      :show="showDeleteObjectModal"
      header="Are you sure?",
      :text="`Are you sure you want to delete <strong>${objectToDelete.full_path}</strong>? This is an irreversible action.`"
      variant="danger"
      @close="showDeleteObjectModal = false",
      @confirm="deleteObject(objectToDelete.id)")
</template>

<script>
  import { mapState } from 'vuex'
  import DomHelpers from '../factories/DomHelpers'
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'
  import ApiAws from '../factories/ApiAws'
  import ApiCloudObjects from '../factories/ApiCloudObjects'
  import { isImage } from '../factories/Utilities'

  export default {
    props: {
      directoryId: { type: String, default: null },
    },

    watch: {
      async directoryId() {
        await this.changePage(1)
      },
    },

    data() {
      return {
        showDeleteObjectModal: false,
        objectToDelete: {},
      }
    },

    computed: {
      ...mapState({
        currentDir: (state) => state.objects.currentDirectory,
        currentParentDirId: (state) =>
          state.objects.currentDirectory &&
          state.objects.currentDirectory.parent_directory_id,
        currentBucket: (state) => state.session.current_bucket,
        objectInfo: (state) => state.objects.currentList,

        directories(state) {
          return this.directoryId != null
            ? [
                { full_path: '<<< back', id: this.currentParentDirId || '' },
              ].concat(state.objects.directories)
            : state.objects.directories
        },
      }),

      dirOrBucket() {
        return this.currentDir ? `/${this.currentDir.full_path}` : '/'
      },

      maxShowSize() {
        return 1024 * 250
      },
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,
      isImage,

      downloadObject(objId) {
        DomHelpers.downloadUri(`/file/download/${objId}`)
      },

      promptDeleteObject(obj) {
        this.objectToDelete = obj
        this.showDeleteObjectModal = true
      },

      async fileUploaded(/* [, {objectIds}] */) {
        // console.log('FILE', arguments)
        await this.getObjectList()
      },

      async deleteObject(objId) {
        try {
          await ApiCloudObjects.deleteObject(objId)
          this.showDeleteObjectModal = false

          await this.getObjectList()
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
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
          this.$notify(
            `Began syncing bucket! Any new objects should show up shortly.`
          )
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },

    async created() {
      await this.getObjectList()
    },
  }
</script>
