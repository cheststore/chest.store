<template lang="pug">
  div
    base-header.header.pb-7.pt-7(type="gradient-primary")
      div.container
        div.row
          div.col-lg-12.mb-4
            div.mt-4.text-white {{ `${(currentBucket || {}).name}/${directoryPath}` }}
            div.display-4.text-white {{ file.name }}

        div.row
          div.col-lg-9
            div.row
              div.col-md-4.mb-1
                stats-card(
                  title="Object Size"
                  type="gradient-orange"
                  :sub-title="humanFileSize(file.size_bytes)"
                  icon="ni ni-box-2"
                  class="mb-4")
                  //- template(slot="footer")
                  //-   span.text-success.mr-2
                  //-     i.fa.fa-arrow-up
                  //-     | 3.48%
                  //-   span.text-nowrap Since last month
              div.col-md-4.mb-1
                stats-card(
                  title="Versions"
                  type="gradient-green"
                  :sub-title="`${versionInfo.total}`"
                  icon="ni ni-bullet-list-67"
                  class="mb-4")
                  //- template(slot="footer")
                  //-   span.text-success.mr-2
                  //-     i.fa.fa-arrow-up
                  //-     | 3.48%
                  //-   span.text-nowrap Since last month
              div.col-md-4.mb-1
                stats-card(
                  title="Last Updated"
                  type="gradient-default"
                  :sub-title="getFormattedDate(file.last_modified, 'YYYY-MM-DD')"
                  icon="ni ni-watch-time"
                  class="text-nowrap mb-4")
                  //- template(slot="footer")
                  //-   span.text-success.mr-2
                  //-     i.fa.fa-arrow-up
                  //-     | 3.48%
                  //-   span.text-nowrap Since last month
          div.col-lg-3
            router-link.mb-2.btn.btn-sm.btn-secondary.w-100(
              :to="currentDir ? `/directory/${currentDir.id}` : '/'") &lt; Back to bucket {{ (currentBucket || {}).bucket_uid }}
            file-uploader.mb-2(
              :dir="currentDir && currentDir.full_path"
              :remove-after-upload="true"
              :btn-only="true"
              btn-size="sm"
              :btn-text="`Upload New Version`"
              btn-class="w-100"
              btn-variant="success"
              @added="getObject()")
            base-button.mb-2.w-100(type="default",size="sm",@click="downloadObject()") Download Object
    div.container.mt--7
      div.row
        loader.col-12(v-if="isLoadingLocal")
        div.col-12(v-else)
          div.row
            div.col-lg-9.mb-4
              div.card.shadow
                div.card-header
                  h4.m-0 {{ file.name }}
                div.card-body.py-2.small.d-flex.justify-content-center
                  //- div.mb-2 Pull object and it's version history
                  pre.m-0(v-highlightjs)
                    code.sh
                      | git clone {{ cloneUrl }}
                div.card-body.border-top
                  div.row
                    div.col
                      div.d-flex.justify-content-center(v-if="isImage(file.full_path)")
                        img.img-fluid.img-thumbnail(:src="`/file/download/${file.id}`")
                      div.card(v-else-if="fileAsciiCache",v-highlightjs)
                        div.card-header.py-2
                          div.d-flex.align-items-center
                            h5.m-0 Plain Text Preview
                            div.ml-2
                              base-button(
                                type="primary",
                                size="sm",
                                @click="wrapPreview = !wrapPreview") {{ wrapPreview ? 'Unwrap' : 'Wrap' }} Text
                        div.card-body.bg-secondary
                          pre
                            code.sh(:style="getPreviewStyle") {{ fileAsciiCache }}
                      div(v-else)
                        base-alert.mb-0(type="warning")
                          | This is a binary file that can't yet be displayed in the browser.
                    //- div.col-lg-6.border-left
                    //-   div put something here
            div.col-lg-3.mb-4
              div.card.shadow
                div.card-header.py-2
                  h4.mb-0 Version History
                div.card-body.p-0(v-if="versionInfo.initialized")
                  base-alert.mb-0.p-1.rounded-0(type="success",style="font-size: 11px")
                    div.d-flex.align-items-center
                      i.mr-2.ni.ni-check-bold(style="font-size: 24px;")
                      div
                        | There was no version history yet so we just
                        | initialized the first version for this object!
                div.table-responsive.mb-0
                  base-table.table.align-items-center.table-flush(
                    thead-classes="thead-light"
                    tbody-classes="list"
                    no-data-placeholder="No version history available..."
                    :data="versionInfo.all")
                    template(slot="columns")
                      th.py-1 Versions
                    template(slot-scope="{row}")
                      td.py-1
                        div.d-flex.align-items-center.small
                          div {{ row.author_email }}
                          div.ml-auto.text-gray
                            | {{ getFormattedDate(row.date, 'YYYY-MM-DD') }}
                        div
                          strong {{ row.author_name }}

</template>

<script>
  import { mapState } from 'vuex'
  import ApiCloudObjects from '../factories/ApiCloudObjects'
  import DomHelpers from '../factories/DomHelpers'
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'
  import { isImage, checkFileAscii } from '../factories/Utilities'

  export default {
    props: {
      objectId: { type: [Number, String], required: true },
    },

    watch: {
      async objectId(newId) {
        this.fileAsciiCache = false
        await Promise.all([
          this.getObject(newId),
          this.checkAndCacheIsFileAscii(newId),
        ])
      },
    },

    data() {
      return {
        isLoadingLocal: true,
        fileAsciiCache: false,
        wrapPreview: false,
      }
    },

    computed: {
      ...mapState({
        currentBucket: (state) => state.session.current_bucket,
        currentDir: (state) => state.objects.currentDirectory,
        file: (state) => state.objects.currentObject,
        versionInfo: (state) => state.objects.currentObjectHistory,
        username: (state) => state.session.user.username,
      }),

      cloneUrl() {
        return `${location.origin}/git/${this.username}/${this.objectId}`
      },

      directoryPath() {
        if (!(this.file && this.file.full_path)) return
        const pathInfo = this.file.full_path.split('/')
        return pathInfo.slice(0, pathInfo.length - 1).join('/')
      },

      getPreviewStyle() {
        return this.wrapPreview ? { whiteSpace: 'pre-wrap' } : ''
      },
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,
      isImage: isImage,

      downloadObject() {
        DomHelpers.downloadUri(`/file/download/${this.objectId}`)
      },

      async checkAndCacheIsFileAscii(id = this.objectId) {
        try {
          if (this.fileAsciiCache) return
          const fileBlob = await ApiCloudObjects.downloadObjectBlob(id)
          return (this.fileAsciiCache = await checkFileAscii(fileBlob))
        } catch (err) {
          // console.error('error checking cache', err)
          this.fileAsciiCache = false
        }
      },

      async getObject(id = this.objectId) {
        try {
          this.isLoadingLocal = true
          this.$store.commit('SET_BUCKET_OBJECT', { id })
          await this.$store.dispatch('getCurrentObject')
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        } finally {
          this.isLoadingLocal = false

          await this.getVersionHistory()
        }
      },

      async getVersionHistory() {
        await this.$store.dispatch('getCurrentObjHistory')
      },
    },

    async created() {
      await Promise.all([this.getObject(), this.checkAndCacheIsFileAscii()])
    },
  }
</script>
