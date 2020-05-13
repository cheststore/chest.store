<template lang="pug">
  div
    div.row.mb-4
      div.col-lg-12.d-flex.align-items-center
        div.text-large.text-gray #[strong {{ objectInfo.totalCount }}] objects in #[strong {{ dirOrBucket }}]
        button.ml-auto.btn.btn-vsm.btn-primary(@click="syncBucket()") Sync Bucket Manually

    ul.list-unstyled.object-list
      li.text-large.pl-4(v-if="directoryId != null")
        router-link(:to="currentParentDirId ? `/directory/${currentParentDirId}` : '/'") ..
      template(v-if="directories.length > 0")
        li.pl-3.text-gray.small
          a.text-gray(@click="showDirs = !showDirs")
            i ({{ showDirs ? 'hide' : 'show' }} child directories)
        li.pl-4.small(v-if="showDirs",v-for="dir in directories")
          //- div.small.text-gray
          //-   small {{ dir.full_path }}
          router-link.small.text-gray(:to="`/directory/${dir.id}`") {{ dir.full_path }}
      li.px-3.mt-2.py-2(v-if="objectInfo.totalCount === 0")
        i No objects found in #[strong {{ dirOrBucket }}]...
      li.px-3.py-2.border-bottom.object(v-else,v-for="(obj, index) in objectInfo.data")
        file-list-row(:file="obj",:ind="index")

    div.row
      div.d-none.col-md-6.d-md-flex.align-items-center(v-if="objectInfo.totalCount > 0")
        div.text-gray
          | page #[strong {{ objectInfo.currentPage }}] of #[strong {{ objectInfo.numberPages }}]
      div.col-md-6
        pagination.mt-1(
          :info="objectInfo",
          @changePage="changePage",
          @changePerPage="changePerPage")
</template>

<script>
  import { mapState } from 'vuex'
  import FileListRow from './FileListRow'
  import ApiAws from '../../factories/ApiAws'

  export default {
    props: {
      directoryId: { type: String, default: null }
    },

    watch: {
      async directoryId() {
        await this.changePage(1)
        this.initShowDirs()
      }
    },

    data() {
      return {
        showDirs: false
      }
    },

    computed: {
      ...mapState({
        currentDir: state => state.objects.currentDirectory,
        currentParentDirId: state => state.objects.currentDirectory && state.objects.currentDirectory.parent_directory_id,
        currentBucket: state => state.session.current_bucket,
        directories: state => state.objects.directories,
        objectInfo: state => state.objects.currentList
      }),

      dirOrBucket() {
        return this.currentDir ? `/${this.currentDir.full_path}` : '/'
      }
    },

    methods: {
      initShowDirs() {
        this.showDirs = false
        if (this.objectInfo.totalCount === 0)
          this.showDirs = true
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
          window.toastr.success(`Began syncing bucket! Any new objects should show up shortly.`)
        } catch(err) {
          window.toastr.error(err.message)
        }
      }
    },

    async created() {
      await this.getObjectList()
      this.initShowDirs()
    },

    components: {
      FileListRow
    }
  }
</script>