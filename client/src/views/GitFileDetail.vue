<template lang="pug">
  div
    loader.col-12(v-if="isLoadingLocal")
    div(v-else)
      base-header.header.pb-7.pt-7(type="gradient-success")
        div.container
          //- div.row
          //-   div.col-lg-12.mb-4.mt-4
          //-     div.d-flex.align-items-center
          //-       div
          //-         span.avatar.bg-white.p-1.mr-2
          //-           i.fab.fa-git-alt
          //-       div.row
          //-         div.col-lg-9.nowrap
          //-           div.display-4.text-white {{ file.name }}

          div.row
            div.col
              file-detail-stats(
                :size-bytes="file.file.stat.size"
                :last-modified="file.file.stat.mtime")
      div.container.mt--7
        div.row
          div.col-12
            div.row
              div.col.mb-4
                div.card.shadow
                  div.card-header
                    div.row.small-gutters
                      div.col-lg-7
                        h4.m-0.d-flex.align-items-center
                          bucket-repo-list-nav-tabs.mr-2
                          git-path-breadcrumbs(
                            :repo-id="id",
                            :repo-name="repo.repo",
                            :path="pathMatch")
                      div.col-lg-5
                        div.d-flex.align-items-center.justify-content-end.nowrap
                          base-button.d-flex.align-items-center.mr-2(
                            type="default",
                            size="sm",
                            @click="$router.push(`/repos`)")
                            | #[i.fab.fa-git-alt.mr-2] Back to all git repos
                          file-link-icon.mr-2(entity-table="git_repos",:entity-id="id",:path="pathMatch")
                          base-button.d-flex.align-items-center.justify-content-center(
                            type="info",
                            size="sm",
                            @click="downloadFile()")
                            | #[i.ni.ni-cloud-download-95.mr-2] Download File
                  //- div.card-body.p-0
                  //-   git-clone-url.text-center(:repo-name="repo.repo")
                  div.card-body
                    div.row
                      preview-object.col(
                        :is-git-file="true"
                        :object-id="id"
                        :object-path="pathMatch"
                        :override-download-path="downloadFilePath")
                      //- div.col-lg-6.border-left
                      //-   div put something here
</template>

<script>
  import { mapState } from 'vuex'
  import DomHelpers from '../factories/DomHelpers'

  export default {
    props: {
      id: { type: String, required: true },
      pathMatch: { type: String, default: null },
    },

    data() {
      return {
        isLoadingLocal: true,
      }
    },

    computed: {
      ...mapState({
        file: (state) => state.gitrepos.currentFile,
        repo: (state) => state.gitrepos.currentRepo,
        username: (state) => state.session.user.username,
      }),

      cloneUrl() {
        return `${location.origin}/git/${this.username}/${this.id}`
      },

      downloadFilePath() {
        return (path) => {
          return `/api/1.0/gitrepos/file/download?id=${
            this.id
          }&path=${encodeURIComponent(path)}`
        }
      },
    },

    methods: {
      downloadFile() {
        const fileSplit = this.pathMatch.split('/')
        DomHelpers.downloadUri(
          this.downloadFilePath(this.pathMatch),
          fileSplit[fileSplit.length - 1]
        )
      },

      async getGitFile(id = this.id) {
        try {
          this.isLoadingLocal = true
          await this.$store.dispatch('getCurrentGitRepoFile', {
            id,
            path: this.pathMatch,
          })
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        } finally {
          this.isLoadingLocal = false
        }
      },
    },

    async created() {
      await this.getGitFile()
    },
  }
</script>
