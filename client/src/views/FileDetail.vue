<template lang="pug">
  div
    base-header.header.pb-7.pt-7(type="gradient-primary")
      div.container
        div.row
          div.col-lg-12.mb-4
            div.mt-4.text-white(v-if="directoryPath") {{ directoryPath }}
            div.display-4.text-white {{ file.name }}

        div.row
          div.col-lg-9
            div.row
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
                  :sub-title="`${versions.length}`"
                  icon="ni ni-bullet-list-67"
                  class="mb-4")
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
                    code.bash
                      | git clone {{ cloneUrl }}
                div.card-body.border-top
                  div another section
            div.col-lg-3.mb-4
              div.card.shadow
                div.card-header.py-2
                  h4.mb-0 Version History
                div.table-responsive.mb-0
                  base-table.table.align-items-center.table-flush(
                    thead-classes="thead-light"
                    tbody-classes="list"
                    no-data-placeholder="No version history available..."
                    :data="versions")
                    template(slot="columns")
                      th.py-1 Versions
                    template(slot-scope="{row}")
</template>

<script>
  import { mapState } from 'vuex'
  // import ApiFiles from '../factories/ApiFiles'
  import DomHelpers from '../factories/DomHelpers'
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'

  export default {
    props: {
      objectId: { type: [Number, String], required: true },
    },

    watch: {
      async objectId(newId) {
        await this.getObject(newId)
      },
    },

    data() {
      return {
        isLoadingLocal: true,
        versions: [],
      }
    },

    computed: {
      ...mapState({
        currentBucket: (state) => state.session.current_bucket,
        currentDir: (state) => state.objects.currentDirectory,
        file: (state) => state.objects.currentObject,
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
      humanFileSize: StringHelpers.humanFileSize,

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
        }
      },
    },

    async created() {
      await this.getObject()
    },
  }
</script>
