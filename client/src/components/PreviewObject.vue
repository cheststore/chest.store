<template lang="pug">
  div
    div.d-flex.justify-content-center(v-if="isImage(objectPath)")
      img.img-fluid.img-thumbnail(:src="getDownloadLink")
    div(v-else-if="!pdfParseError")
      div.card
        div.card-body
          pdf-viewer(
            :src="getDownloadLink",
            @error="setPdfParseError")
    div.card(v-else-if="objectAsciiCache")
      div.card-header.py-2
        div.d-flex.align-items-center
          h5.m-0 Object Preview
          div.ml-2
            base-button(
              type="primary",
              size="sm",
              @click="wrapPreview = !wrapPreview") {{ wrapPreview ? 'Unwrap' : 'Wrap' }} Text
      pre.mb-0(v-highlightjs)
        code(
          :class="objectAsciiCache.length > 4e4 ? 'bash' : ''",
          :style="getPreviewStyle") {{ objectAsciiCache }}
    div(v-else)
      base-alert.mb-0(type="warning")
        | This is a binary file that can't yet be displayed in the browser.
        | #[base-button(type="info",size="sm",@click="downloadObject()") Download Object] to
        | open it and review it's contents.
</template>

<script>
  import ApiCloudObjects from '../factories/ApiCloudObjects'
  import DomHelpers from '../factories/DomHelpers'
  import { isImage, checkFileAscii } from '../factories/Utilities'

  export default {
    name: 'preview-object',

    props: {
      objectPath: { type: String, required: true },
      objectId: { type: String, required: true },
      isGitFile: { type: Boolean, default: false },
      overrideDownloadPath: { type: Function, default: null },
    },

    data() {
      return {
        objectAsciiCache: false,
        wrapPreview: false,
        pdfParseError: null,
      }
    },

    computed: {
      getPreviewStyle() {
        return this.wrapPreview ? { whiteSpace: 'pre-wrap' } : ''
      },

      getDownloadLink() {
        return typeof this.overrideDownloadPath === 'function'
          ? this.overrideDownloadPath(this.objectPath)
          : `/file/download/${this.objectId}`
      },
    },

    methods: {
      isImage: isImage,

      downloadObject() {
        DomHelpers.downloadUri(this.getDownloadLink)
      },

      setPdfParseError(err) {
        this.pdfParseError = err
        // console.error('ERR', this.pdfParseError)
      },

      async checkAndCacheIsObjectAscii() {
        try {
          if (this.objectAsciiCache) return

          let fileBlob
          if (this.isGitFile) {
            fileBlob = await ApiCloudObjects.downloadObjectBlob(
              `?id=${this.objectId}&path=${encodeURIComponent(
                this.objectPath
              )}`,
              `/api/1.0/gitrepos/file/download`
            )
          } else {
            fileBlob = await ApiCloudObjects.downloadObjectBlob(this.objectId)
          }
          return (this.objectAsciiCache = await checkFileAscii(fileBlob))
        } catch (err) {
          this.$log.error('error setting cache', err)
          this.objectAsciiCache = false
        }
      },
    },

    async created() {
      await this.checkAndCacheIsObjectAscii()
    },
  }
</script>
