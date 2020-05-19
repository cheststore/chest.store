<template lang="pug">
  div
    dropzone(
      :id="`file-uploader-${_uid}`"
      :ref="`file-uploader-${_uid}`"
      :class="uploaderClasses"
      :options="finalOptions"
      @vdropzone-processing="fileProcessing"
      @vdropzone-error="errorAddingFile"
      @vdropzone-success="successAddingFile")

    base-button(
      v-if="btnOnly",
      :id="`uploader-btn-${_uid}`",
      :type="btnVariant") {{ btnText || 'Upload Files' }}
</template>

<script>
  import Dropzone from 'vue2-dropzone'

  export default {
    name: 'file-uploader',

    props: {
      url: { type: String },
      dir: { type: String, default: '' },
      options: { type: Object, default: null },
      removeAfterUpload: { type: Boolean, default: false },
      size: { type: String, default: null },

      btnOnly: { type: Boolean, default: false }, // if true, only show a button to click to upload files
      btnText: { type: String, default: null },
      btnVariant: { type: String, default: 'primary' },
    },

    computed: {
      finalOptions() {
        let btnOptions = this.btnOnly
          ? { clickable: `#uploader-btn-${this._uid}` }
          : null

        return {
          url: () => `/object/upload?dir=${encodeURIComponent(this.dir || '')}`,
          maxFilesize: 20480, // 20GB
          parallelUploads: 4,
          thumbnailHeight: 80,
          thumbnailWidth: 80,
          timeout: 600000, // 600s, 10min
          ...this.options,
          ...btnOptions,
        }
      },

      uploaderClasses() {
        if (this.btnOnly) return 'd-none'

        return ['sm', 'small'].includes(this.size) ? 'small-dropzone' : ''
      },
    },

    methods: {
      fileProcessing(...args) {
        this.$emit('processing', args)
      },

      errorAddingFile(...args) {
        this.$emit('error', args)
      },

      successAddingFile(...args) {
        this.$emit('added', args)

        if (this.removeAfterUpload) {
          if (this.$refs[`file-uploader`])
            this.$refs[`file-uploader`].dropzone.removeAllFiles()
        }
      },
    },

    components: {
      Dropzone,
    },
  }
</script>

<style lang="scss">
  .dropzone {
    border-style: dashed !important;

    &.small-dropzone {
      font-size: 0.8em;
      min-height: 55px;
      padding: 6px;

      .dz-message {
        margin: 0.8em 0;
      }

      .dz-preview {
        max-height: 55px !important;
        min-height: 55px !important;
        max-width: 55px !important;
        margin: 4px;

        .dz-details {
          font-size: 0.8em;
          line-height: inherit;
          max-height: 55px;
          padding: 0.5em;

          .dz-size {
            font-size: 8px;
          }
        }

        .dz-error-mark,
        .dz-success-mark {
          top: 0%;
        }

        .dz-progress {
          width: 40px;
          left: 85%;
          top: 50%;
        }

        .dz-image {
          max-height: 55px !important;
          max-width: 55px !important;
        }
      }
    }
  }
</style>
