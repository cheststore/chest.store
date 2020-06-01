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
              h3.mb-0 {{ dirOrBucket == '/' ? currentBucket.name : dirOrBucket }} objects
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
                div.col-lg-6.p-lg-2(v-if="allBuckets && allBuckets.length > 0")
                  select.form-control(v-model="currentBucketId")
                    option(v-for="bucket in allBuckets",:value="bucket.id")
                      | {{ bucket.name }} ({{ getProviderType(bucket.type).text }})
                div.col.p-lg-2
                  base-input.m-0(
                    v-model="searchQuery"
                    :valid="(searchQuery && searchQuery.length > 0) || null"
                    placeholder="Search for objects...")
            div.card-body.py-2.d-flex.justify-content-end
              base-pagination.mb-0(
                :total="objectInfo.totalCount"
                :value="objectInfo.currentPage"
                :perPage="objectInfo.perPage"
                @input="changePage")
            div.table-responsive.mb-0
              table.table.tablesorter.align-items-center.table-flush
                thead.thead-light
                  tr
                    th Object
                    th Size
                    th Last Modified
                    th
                tbody.list(v-if="directories.length > 0")
                  tr(v-for="dir in directories")
                    td.py-2(colspan="100%")
                      router-link(:to="`/directory/${dir.id}`")
                        div.d-flex.align-items-center.ml-4
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

        delayRefresh: debounce(async () => {
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
          return this.currentBucket.id
        },

        async set(newId) {
          await ApiAuth.selfUpdate({ current_bucket_id: newId })
          await this.$store.dispatch('getUserSession', true)
          this.directoryId = null
          await this.getObjectList()
        },
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
          this.refreshList()
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

      refreshList() {
        this.delayRefresh()
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
      await this.getObjectList()
    },
  }
</script>
