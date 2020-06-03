<template lang="pug">
  div
    base-header.pb-6.pb-8.pt-5.pt-md-8(type="gradient-info")
      div.row
        div.col-lg-12
          h2.text-white.mb-0
            | #[strong {{ objectInfo.totalCount }}] objects in #[strong {{ dirOrBucket }}]

    div.container.mt--7
      div.row
        //- div.col-lg-3.mb-4
        //-   div.card.shadow
        //-     div.card-header.border-0
        //-       h6.mb-0 Bucket Directories
        //-     div.table-responsive.mb-0
        //-       base-table.table.align-items-center.table-flush(
        //-         thead-classes="thead-light"
        //-         tbody-classes="list"
        //-         no-data-placeholder="No directories at this level..."
        //-         :data="directories")
        //-         template(slot="columns")
        //-           th.py-1 Directory
        //-         template(slot-scope="{row}")
        //-           td.py-1
        //-             router-link.text-primary.small(:to="`/directory/${row.id}`") {{ row.full_path }}
        div.col.mb-4
          div.card.shadow
            div.card-header.border-0.d-flex.align-items-center
              h3.mb-0 {{ includeAllBuckets ? "All buckets'" : (dirOrBucket == '/' ? currentBucket.name : dirOrBucket) }} objects
              div.ml-auto.d-flex.align-items-center
                base-button(
                  type="primary",
                  size="sm",
                  @click="syncBucket()") Sync Entire Bucket
                file-uploader(
                  :dir="currentDirPath"
                  :remove-after-upload="true"
                  :btn-only="true"
                  btn-size="sm"
                  :btn-text="`Add File to ${dirOrBucket == '/' ? currentBucket.name : dirOrBucket}`"
                  btn-variant="warning"
                  @added="fileUploaded")
            div.card-header.py-2.border-top
              //- addon-left-icon="ni ni-tag"
              div.row
                div.col-lg-5.p-lg-2.border-right(v-if="allBuckets && allBuckets.length > 0")
                  label.form-control-label.mb-0(for="current-bucket") Bucket
                  div.d-flex.align-items-center
                    select#current-bucket.form-control.form-control-sm(v-model="currentBucketId")
                      option(v-for="bucket in allBuckets",:value="bucket.id")
                        | {{ bucket.name }} ({{ getProviderType(bucket.type).text || 'N/A' }})
                    base-checkbox.ml-3.nowrap(v-model="includeAllBuckets") All Buckets?
                div.col.p-lg-2
                  base-input.m-0(
                    v-model="searchQuery"
                    label="Quick Search"
                    label-classes="mb-0"
                    input-classes="form-control-sm"
                    :valid="(searchQuery && searchQuery.length > 0) || null"
                    placeholder="Search for objects...")
            div.card-body.py-2.d-flex.justify-content-end
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
                            span.avatar.avatar-vsm.bg-white.mr-4
                              img(
                                :id="`dir-bucket-icon-${dir.id}`"
                                :src="$store.state.getBucket(dir.bucket_id).img_icon_path")
                              b-tooltip(:target="`dir-bucket-icon-${dir.id}`")
                                | {{ $store.state.getBucket(dir.bucket_id).name }}
                            i.fa.fa-2x.fa-level-up.mr-3(v-if="dir.back")
                            i.fa.fa-2x.fa-folder.mr-2(v-else)
                            div
                              div(:to="`/directory/${dir.id}`") {{ dir.name || dir.full_path }}
                              div.text-light(v-if="dir.name",style="font-size: 0.6rem") {{ dir.full_path }}
                tbody.list(style="border-width: 1px")
                  tr(v-if="objectInfo.totalCount === 0")
                    td(colspan="100%") No objects in {{ dirOrBucket }}
                  tr(v-else,v-for="(row, index) in objectInfo.data")
                    th(scope="row")
                      div.d-flex.align-items-center
                        span.avatar.avatar-vsm.bg-white.mr-4
                          img(
                            :id="`obj-bucket-icon-${row.id}`"
                            :src="$store.state.getBucket(row.bucket_id).img_icon_path")
                          b-tooltip(:target="`obj-bucket-icon-${row.id}`")
                            | {{ $store.state.getBucket(row.bucket_id).name }}
                        router-link(:to="`/object/${row.id}`")
                          div.d-flex.align-items-center
                            span.bg-white.avatar.avatar-sm.border.mr-2(v-if="isImage(row.full_path) && row.size_bytes < maxShowSize")
                              img(:src="`/file/download/${row.id}`")
                            i.fa.fa-2x.mr-2(v-else,:class="getFileIconClass(row.full_path)")
                            div
                              div {{ row.name }}
                              div.text-light(style="font-size: 0.6rem") {{ row.full_path }}
                    td {{ humanFileSize(row.size_bytes || 0) }}
                    td {{ getFormattedDate(row.last_modified) }}
                    td
                      base-dropdown.dropdown(position="right")
                        a(slot="title")
                          i.fa.fa-ellipsis-h
                        template
                          a.dropdown-item(@click="downloadObject(row.id)") Download Object
                          a.dropdown-item(@click="promptDeleteObject(row)") Delete Object
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
  import ApiAuth from '../factories/ApiAuth'
  import ApiProviders from '../factories/ApiProviders'
  import ApiCloudObjects from '../factories/ApiCloudObjects'
  import {
    debounce,
    isImage,
    fileExtensionIconClasses,
  } from '../factories/Utilities'

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

        objectListUpdateDelay: debounce(async () => {
          await this.changePage(1)
        }, 300),
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
        currentBucket: (state) => state.session.current_bucket,
        objectInfo: (state) => state.objects.currentList,
        providerTypes: (state) => state.providerTypes,
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

      currentBucketId: {
        get() {
          return this.includeAllBuckets ? null : this.currentBucket.id
        },

        async set(newId) {
          await ApiAuth.selfUpdate({ current_bucket_id: newId })
          await this.$store.dispatch('getUserSession', true)
          this.directoryId = null

          // NOTE: setter function for this var will refresh the list (see below)
          this.includeAllBuckets = false
        },
      },

      includeAllBuckets: {
        get() {
          return this.$store.state.objects.includeAllBuckets
        },

        async set(bool) {
          this.$store.commit('SET_INCLUDE_ALL_BUCKETS', bool)
          await this.changePage(1)
        },
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
        return this.currentDir ? `/${this.currentDir.full_path}` : '/'
      },

      maxShowSize() {
        return 1024 * 250
      },

      searchQuery: {
        get() {
          return this.$store.state.objects.currentListFilters.searchQuery
        },

        async set(value) {
          this.$store.commit('SET_BUCKET_OBJECT_FILTER', {
            key: 'searchQuery',
            value,
          })
          await this.objectListUpdateDelay()
        },
      },
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,
      isImage,

      getFileIconClass(fileName) {
        const fileSplit = (fileName || '').toLowerCase().split('.')
        const extension = fileSplit[fileSplit.length - 1]
        return (
          fileExtensionIconClasses[extension || 'default'] ||
          fileExtensionIconClasses['default']
        )
      },

      downloadObject(objId) {
        DomHelpers.downloadUri(`/file/download/${objId}`)
      },

      getProviderType(type) {
        return this.providerTypes.find((t) => t.value === type) || {}
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
