<template lang="pug">
  div
    base-header.pb-6.pb-8.pt-8(type="gradient-success")
      //- div.row
      //-   div.col-lg-12
      //-     h2.text-white.mb-0
      //-       div.row
      //-         div.col-lg-9.d-flex.align-items-center.nowrap
      //-           strong.mr-1 {{ objectInfo.totalCount }}
      //-           div.mr-1 objects in
      //-           div.overflow-ellipses.begin.no-hover
      //-             strong {{ dirOrBucket }}

    loader(v-if="isLoadingLocal")
    div.container.mt--7(v-else)
      div.row
        div.col.mb-4
          div.card.shadow
            div.card-header.border-0.d-block.d-lg-flex.align-items-center
              bucket-repo-list-nav-tabs.mr-2
              h3.mb-0 {{ repo.repo }}
              //- h3.mb-0.d-flex.align-items-center.nowrap
              //-   bucket-repo-list-nav-tabs.mr-2
              //-   div.overflow-ellipses.begin.no-hover.mr-1 {{ includeAllBuckets ? "All" : dirOrBucket }}
              //-   div objects
              div.ml-auto
                base-button.d-flex.align-items-center(
                  type="default",
                  size="sm",
                  @click="$router.push(`/repos`)")
                  | #[i.fab.fa-git-alt.mr-2] Back to all git repos
            div.card-body.py-3.border-top(v-if="pathMatch")
              git-path-breadcrumbs(
                :repo-id="id",
                :repo-name="repo.repo",
                :path="pathMatch")
            //- div.card-body.p-0
            //-   git-clone-url.text-center(:repo-name="repo.repo")
            div.table-responsive.mb-0
              table.table.tablesorter.align-items-center.table-flush
                thead.thead-light
                  tr
                    th File
                    th Size
                    th Last Modified
                    th
                file-list-tbody(
                  table-type="git"
                  :total-count="fileList.length"
                  :data="fileList"
                  :row-link="fileLink")
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    props: {
      id: { type: String, required: true },
      pathMatch: { type: String, default: null },
    },

    watch: {
      async id() {
        await this.getRepoAndDirList()
      },

      async pathMatch() {
        await this.getRepoAndDirList()
      },
    },

    data() {
      return {
        isLoadingLocal: true,
      }
    },

    computed: {
      ...mapState({
        repo: (state) => state.gitrepos.currentRepo,
        fileList(state) {
          return (state.gitrepos.currentRepo.files || []).map((f) => ({
            id: null,
            file_type: f.file.fileType,
            bucket_id: this.repo.bucket_id,
            name: f.file.name,
            full_path: this.pathMatch
              ? `${this.pathMatch}/${f.file.name}`
              : `${f.file.name}`,
            last_modified: f.file.stat.mtime || null,
            size_bytes: f.file.stat.size || 0,
          }))
        },
      }),

      fileLink() {
        return (row) => {
          const path = this.pathMatch ? `/${this.pathMatch}` : ''
          if (row.file_type === 'directory')
            return `/repo/${this.id}${path}/${row.name}`

          return `/repo/${this.id}/file/${path}/${row.name}`
        }
      },
    },

    methods: {
      async getRepoAndDirList() {
        try {
          await this.$store.dispatch('getCurrentGitRepoDir', {
            id: this.id,
            path: this.pathMatch,
          })
        } finally {
          this.isLoadingLocal = false
        }
      },
    },

    async created() {
      await this.getRepoAndDirList()
    },
  }
</script>
