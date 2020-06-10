<template lang="pug">
  div
    base-header.pb-6.pb-8.pt-5.pt-md-8(type="gradient-info")
      div.row
        div.col-lg-12
          h2.text-white.mb-0
            div.row
              div.col-lg-9.d-flex.align-items-center.nowrap
                strong.mr-1 {{ objectInfo.totalCount }}
                div.mr-1 objects in
                div.overflow-ellipses.begin.no-hover
                  strong {{ dirOrBucket }}

    div.container.mt--7
      div.row
        div.col.mb-4
          div.card.shadow
            div.card-header.border-0
              div.row
                h3.col-lg-8.mb-0.d-flex.align-items-center.nowrap
                  bucket-repo-list-nav-tabs.mr-2
                  div.overflow-ellipses.begin.no-hover.mr-1
                    | {{ includeAllBuckets && allBuckets.length > 0 ? "All" : dirOrBucket }} objects
                div.col-lg-4.d-flex.align-items-center.justify-content-end.nowrap
                  base-button(
                    type="secondary",
                    size="sm",
                    @click="syncBucket()") Sync Entire Bucket
                  file-uploader(
                    :dir="currentDirPath"
                    :remove-after-upload="true"
                    :btn-only="true"
                    btn-size="sm"
                    :btn-text="`Add File`"
                    btn-variant="warning"
                    @added="fileUploaded")
            div.card-header.border-top
              object-path-breadcrumbs(
                :current-directory-id="'123'",
                :path="dirOrBucket")
            div.card-header.py-2
              file-list-filters(@update="changePage(1)")
            div.card-body.py-2.d-flex.justify-content-end(v-if="objectInfo.numberPages > 1")
              base-pagination.mb-0(
                :total="objectInfo.totalCount"
                :value="objectInfo.currentPage"
                :perPage="objectInfo.perPage"
                @input="changePage")
            div.table-responsive.mb-0(style="overflow: visible;")
              table.table.tablesorter.align-items-center.table-flush
                thead.thead-light
                  tr
                    th Object
                    th Size
                    th Last Modified
                    th
                tbody.list(v-if="directories.length > 0 && !searchQuery")
                  tr(v-for="dir in directories")
                    td.py-2(colspan="100%")
                      div.d-flex.align-items-center
                        router-link(:to="`/directory/${dir.id}`")
                          div.d-flex.align-items-center
                            span.avatar.avatar-vsm.bg-white.mr-4(v-if="!dir.back")
                              img(
                                :id="`dir-bucket-icon-${dir.id}`"
                                :src="$store.state.getBucket(dir.bucket_id).img_icon_path")
                              b-tooltip(:target="`dir-bucket-icon-${dir.id}`")
                                | {{ $store.state.getBucket(dir.bucket_id).name }}
                            i.fa.fa-2x.fa-level-up.mr-3(v-if="dir.back")
                            i.fa.fa-2x.fa-folder.mr-2(v-else)
                            div
                              div(:to="`/directory/${dir.id}`") {{ truncateString(dir.name || dir.full_path, 80) }}
                              div.text-light(v-if="dir.name",style="font-size: 0.6rem")
                                | {{ $store.state.getBucket(dir.bucket_id).name }}/{{ truncateString(dir.full_path, 160) }}
                file-list-tbody(
                  :total-count="objectInfo.totalCount"
                  :data="objectInfo.data"
                  @download="downloadObject"
                  @delete="promptDeleteObject")
            div.card-footer.py-2.d-flex.justify-content-end
              base-pagination.mb-0(
                :total="objectInfo.totalCount"
                :value="objectInfo.currentPage"
                :perPage="objectInfo.perPage"
                @input="changePage")

    confirmation-modal(
      :show="showDeleteObjectModal"
      header="Are you sure?",
      :text="deleteObjectModalText"
      variant="danger"
      @close="showDeleteObjectModal = false",
      @confirm="deleteObject(objectToDelete.id)")
</template>

<script>
  import { mapState } from 'vuex'
  import DomHelpers from '../factories/DomHelpers'
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'
  import ApiProviders from '../factories/ApiProviders'
  import ApiCloudObjects from '../factories/ApiCloudObjects'
  import { debounce, isImage } from '../factories/Utilities'

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

        objectListUpdate: debounce(
          async () => {
            await this.getObjectList()
          },
          300,
          true
        ),
      }
    },

    computed: {
      ...mapState({
        allBuckets: (state) => state.session.buckets,
        currentDir: (state) => state.objects.currentDirectory,
        currentDirPath: (state) =>
          state.objects.currentDirectory &&
          state.objects.currentDirectory.full_path,
        currentParentDirId: (state) =>
          state.objects.currentDirectory &&
          state.objects.currentDirectory.parent_directory_id,
        currentBucket: (state) => state.session.current_bucket || {},
        includeAllBuckets: (state) => state.objects.includeAllBuckets,
        objectInfo: (state) => state.objects.currentList,
        searchQuery: (state) => state.objects.currentListFilters.searchQuery,
        username: (state) => state.session.user && state.session.user.username,

        directories(state) {
          return this.directoryId != null
            ? [
                {
                  back: true,
                  full_path: 'up one folder',
                  id: this.currentParentDirId || '',
                },
              ].concat(state.objects.directories)
            : state.objects.directories
        },
      }),

      currentBucketId() {
        return this.includeAllBuckets ? null : this.currentBucket.id
      },

      deleteObjectModalText() {
        return `
          Are you sure you want to delete <strong>${this.objectToDelete.full_path}</strong>?
          This deletes the object in the target bucket, although all versions of
          this object are still accessible in your bucket in its version git repo.
          
          <div class="card border mt-3 small">
            <div class="card-body bg-white p-3">
              <code class="text-default">git clone ${location.origin}/git/${this.username}/${this.objectToDelete.id}
            </div>
          </code></div>`
      },

      dirOrBucket() {
        let bucketName = this.currentBucket.name
        if (this.includeAllBuckets && this.allBuckets.length > 1)
          bucketName = ``

        return this.currentDir
          ? `${bucketName}/${this.currentDir.full_path}`
          : `${bucketName}`
      },
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,
      truncateString: StringHelpers.truncateString,
      isImage,

      downloadObject(objId) {
        DomHelpers.downloadUri(`/file/download/${objId}`)
      },

      promptDeleteObject(obj) {
        this.objectToDelete = obj
        this.showDeleteObjectModal = true
      },

      async fileUploaded(/* [, {objectIds}] */) {
        await this.objectListUpdate()
      },

      async deleteObject(objId) {
        try {
          await ApiCloudObjects.deleteObject(objId)
          this.showDeleteObjectModal = false

          await this.objectListUpdate()
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },

      async changePage(newPage) {
        this.$store.commit('SET_BUCKET_OBJECT_LIST_PAGE', newPage)
        await this.objectListUpdate()
      },

      async changePerPage(newPerPage) {
        this.$store.commit('SET_BUCKET_OBJECT_LIST_PER_PAGE', newPerPage)
        this.$store.commit('SET_BUCKET_OBJECT_LIST_PAGE', 1)
        await this.objectListUpdate()
      },

      async getObjectList() {
        await this.$store.dispatch('getObjectsList', {
          bucketId: this.currentBucketId,
          directoryId: this.directoryId,
        })
      },

      async syncBucket() {
        try {
          await ApiProviders.syncCurrentBucket()
          this.$notify(
            `Began syncing bucket! Any new objects should show up shortly.`
          )
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },

    async created() {
      await this.objectListUpdate()
    },
  }
</script>
