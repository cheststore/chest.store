<template lang="pug">
  tbody.list(style="border-width: 1px")
    tr(v-if="totalCount === 0")
      td(colspan="100%") No objects found...
    tr(v-else,v-for="(row, index) in data")
      th(scope="row")
        div.d-flex.align-items-center
          span.avatar.avatar-vsm.bg-white.mr-4
            img(
              :id="`obj-bucket-icon-${row.id}`"
              :src="$store.state.getBucket(row.bucket_id).img_icon_path")
            b-tooltip(:target="`obj-bucket-icon-${row.id}`")
              | {{ $store.state.getBucket(row.bucket_id).name }}
          router-link(:to="objectLink(row)")
            div.d-flex.align-items-center
              span.bg-white.avatar.avatar-sm.border.mr-2(
                v-if="tableType !== 'git' && isImage(row.full_path) && row.size_bytes < maxShowSize")
                img(:src="`/file/download/${row.id}`")
              i.fa.fa-2x.mr-2(v-else,:class="getFileIconClass(row)")
              div
                div {{ truncateString(row.name, 80) }}
                div.text-light(style="font-size: 0.6rem;")
                  | {{ truncateString(row.full_path, 60) }}
      td {{ humanFileSize(row.size_bytes || 0) }}
      td {{ getFormattedDate(row.last_modified) }}
      td
        base-dropdown.dropdown(position="right")
          a(slot="title")
            i.fa.fa-ellipsis-h
          template
            a.dropdown-item(@click="downloadObject(row.id)") Download Object
            a.dropdown-item(v-if="tableType !== 'git'",@click="deleteObject(row)") Delete Object
</template>

<script>
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'
  import { isImage, fileExtensionIconClasses } from '../factories/Utilities'

  export default {
    name: 'file-list-tbody',

    props: {
      tableType: { type: String, default: 'bucket' }, // also can be 'git'
      totalCount: { type: Number, required: true },
      data: { type: Array, required: true },
      rowLink: { type: Function, default: (row) => `/object/${row.id}` },
    },

    computed: {
      maxShowSize() {
        return 1024 * 250
      },
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,
      truncateString: StringHelpers.truncateString,
      isImage,

      objectLink(row) {
        return this.rowLink(row)
      },

      getFileIconClass(file) {
        const fileName = file.full_path
        const type = file.file_type
        if (type && type === 'directory') return 'fa-folder'

        const fileSplit = (fileName || '').toLowerCase().split('.')
        const extension = fileSplit[fileSplit.length - 1]
        return (
          fileExtensionIconClasses[extension || 'default'] ||
          fileExtensionIconClasses['default']
        )
      },

      downloadObject(id) {
        this.$emit('download', id)
      },

      deleteObject(object) {
        this.$emit('delete', object)
      },
    },
  }
</script>
