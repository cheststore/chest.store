<template lang="pug">
  div.row
    div.col-1.d-flex.align-items-center
      | {{ $store.state.getRowNumber(ind, objectInfo.currentPage, objectInfo.perPage) }}.
    div.col
      div.small.text-soft.d-flex.align-items-center.text-gray
        div.overflow-ellipses.no-hover.small {{ file.full_path }}
        div.ml-auto.nowrap.small
          div.ml-2.small.text-right
            | Object last modified
            | #[strong {{ getFormattedDate(file.last_modified) }}]
      div.d-flex.align-items-center
        div.overflow-ellipses.no-hover(:id="`object-${file.id}`")
          router-link(:to="`object/${file.id}`") {{ file.name }}
          b-tooltip(:target="`object-${file.id}`") {{ file.name }}
        div.ml-auto.nowrap.d-flex.align-items-center
          div.ml-2.small.text-gray {{ humanFileSize(file.size_bytes) }}
          div.ml-2
            div.dropdown.clickable
              i.fa.fa-ellipsis-h(
                :id="`object-list-item-options-${_uid}-${ind}`",
                role='button',
                data-toggle='dropdown',
                aria-haspopup='true',
                aria-expanded='false')
              div.dropdown-menu.dropdown-menu-small
                a.dropdown-item(@click="downloadObject(file.id)") Download Object
</template>

<script>
  import { mapState } from 'vuex'
  import DomHelpers from '../../factories/DomHelpers'
  import StringHelpers from '../../factories/StringHelpers'
  import TimeHelpers from '../../factories/TimeHelpers'

  export default {
    props: {
      file: { type: Object, required: true },
      ind: { type: Number, required: true }
    },

    computed: {
      ...mapState({
        objectInfo: state => state.objects.currentList
      })
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,

      downloadObject(objId) {
        DomHelpers.downloadUri(`/file/download/${objId}`)
      }
    }
  }
</script>