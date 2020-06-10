<template lang="pug">
  div
    base-header.header.pb-7.pt-7(type="gradient-info")
      div.container
        div.row
          div.col-lg-12.mb-4.mt-4
            div.d-flex.align-items-center
              div
                span.avatar.bg-white.p-1.mr-2
                  img(:src="$store.state.getBucket(file.bucket_id).img_icon_path")
              div.row.w-100
                div.col-lg-9.nowrap
                  div.text-white.overflow-ellipses.begin.no-hover
                    | {{ directoryPath ? `${currentBucket.name}/${directoryPath}` : currentBucket.name }}
                  div.display-4.text-white {{ file.name }}

        div.row
          div.col-lg-9
            file-detail-stats(
              :size-bytes="file.size_bytes"
              :total-versions="versionInfo.total"
              :last-modified="file.last_modified")
          div.col-lg-3
            router-link.mb-2.btn.btn-sm.btn-secondary.w-100.d-flex.align-items-center.justify-content-center(
              :to="currentDir ? `/directory/${currentDir.id}` : '/'")
              | #[i.ni.ni-bold-left.mr-2]
              | Back to Object Explorer
            file-uploader.mb-2(
              :dir="currentDir && currentDir.full_path"
              :object-id="objectId"
              :remove-after-upload="true"
              :btn-only="true"
              btn-size="sm"
              :btn-text="`Upload New Version`"
              btn-class="w-100"
              btn-icon="ni ni-cloud-upload-96"
              btn-variant="default"
              @added="init()")
            base-button.mb-2.w-100.d-flex.align-items-center.justify-content-center(
              type="info",
              size="sm",
              @click="downloadObject()")
              | #[i.ni.ni-cloud-download-95.mr-2] Download Object
    div.container.mt--7
      div.row
        loader.col-12(v-if="isLoadingLocal")
        div.col-12(v-else)
          div.row
            div.col-lg-9.mb-4
              div.card.shadow
                div.card-header
                  h4.m-0 {{ file.name }}
                div.card-body.py-2.small.d-flex.justify-content-center.bg-secondary.border
                  //- div.mb-2 Pull object and it's version history
                  pre.m-0
                    code
                      | git clone {{ cloneUrl }}
                div.card-body
                  div.row
                    preview-object.col(
                      :object-id="file.id",
                      :object-path="file.full_path")
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
                          strong(:id="`obj-version-${_uid}-${row.hash}`") {{ row.author_name }}
                          b-tooltip(
                            :target="`obj-version-${_uid}-${row.hash}`"
                            placement="bottom"
                            boundary="viewport")
                            | {{ row.hash }}

</template>

<script>
  import { mapState } from 'vuex'
  import DomHelpers from '../factories/DomHelpers'
  import TimeHelpers from '../factories/TimeHelpers'

  export default {
    props: {
      objectId: { type: [Number, String], required: true },
    },

    watch: {
      async objectId(newId) {
        await this.init(newId)
      },
    },

    data() {
      return {
        isLoadingLocal: true,
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
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,

      downloadObject() {
        DomHelpers.downloadUri(`/file/download/${this.objectId}`)
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

      async init(id = this.objectId) {
        await this.getObject(id)
      },
    },

    async created() {
      await this.init()
    },
  }
</script>
