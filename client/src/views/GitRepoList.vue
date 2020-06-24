<template lang="pug">
  div
    base-header.pb-6.pb-8.pt-8(type="gradient-success")
      div.row
        div.col-lg-12
          h2.text-white.mb-0
            div.row
              div.col-lg-9.d-flex.align-items-center.nowrap
                strong.mr-1 {{ gitrepoInfo.totalCount }}
                div.mr-1 git repos in
                div.overflow-ellipses.begin.no-hover
                  strong {{ dirOrBucket }}

    div.container.mt--7
      div.row
        div.col.mb-4
          div.card.shadow
            div.card-header.border-0
              div.row
                div.col-lg-8
                  h3.mb-0.d-flex.align-items-center.nowrap
                    bucket-repo-list-nav-tabs.mr-2
                    div.overflow-ellipses.begin.no-hover.mr-1 {{ includeAllBuckets ? "All" : dirOrBucket }}
                    div git repositories
            div.card-header.py-2.border-top
              file-list-filters(:search="false",@update="changePage(1)")
            div.card-body.py-2.d-flex.justify-content-end(v-if="gitrepoInfo.numberPages > 1")
              base-pagination.mb-0(
                :total="gitrepoInfo.totalCount"
                :value="gitrepoInfo.currentPage"
                :perPage="gitrepoInfo.perPage"
                @input="changePage")
            div.table-responsive.mb-0
              table.table.tablesorter.align-items-center.table-flush
                thead.thead-light
                  tr
                    th Repo
                    th Last Push
                tbody.list(style="border-width: 1px")
                  tr(v-if="gitrepoInfo.totalCount === 0")
                    td(colspan="100%") No repos in {{ truncateString(dirOrBucket, 80) }}
                  tr(v-else,v-for="(row, index) in gitrepoInfo.data")
                    th(scope="row")
                      div.d-flex.align-items-center
                        router-link(:to="`/repo/${row.id}`")
                          div.d-flex.align-items-center
                            i.fab.fa-git-alt.fa-2x.mr-2
                            div
                              div {{ truncateString(row.repo, 80) }}
                              //- div.text-light(style="font-size: 0.6rem;")
                              //-   | {{ truncateString(row.full_path, 60) }}
                    th(scope="row") {{ getFormattedDate(row.updated_at) }}
            div.card-footer.py-2.d-flex.justify-content-end
              base-pagination.mb-0(
                :total="gitrepoInfo.totalCount"
                :value="gitrepoInfo.currentPage"
                :perPage="gitrepoInfo.perPage"
                @input="changePage")
</template>

<script>
  import { mapState } from 'vuex'
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'
  // import ApiCloudObjects from '../factories/ApiCloudObjects'
  import { debounce } from '../factories/Utilities'

  export default {
    data() {
      return {
        repoListUpdate: debounce(
          async () => {
            await this.getRepoList()
          },
          300,
          true
        ),
      }
    },

    computed: {
      ...mapState({
        currentDir: (state) => state.objects.currentDirectory,
        currentBucket: (state) => state.session.current_bucket,
        includeAllBuckets: (state) => state.objects.includeAllBuckets,
        gitrepoInfo: (state) => state.gitrepos.currentList,
        // username: (state) => state.session.user && state.session.user.username,
      }),

      currentBucketId() {
        return this.includeAllBuckets ? null : this.currentBucket.id
      },

      dirOrBucket() {
        let bucketName = this.currentBucket.name
        if (this.includeAllBuckets) bucketName = ``

        return this.currentDir && this.currentDir.full_path
          ? `${bucketName}/${this.currentDir.full_path}`
          : `${bucketName}/`
      },
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      truncateString: StringHelpers.truncateString,

      async fileUploaded(/* [, {objectIds}] */) {
        await this.repoListUpdate()
      },

      async changePage(newPage) {
        this.$store.commit('SET_BUCKET_GITREPO_LIST_PAGE', newPage)
        await this.repoListUpdate()
      },

      async changePerPage(newPerPage) {
        this.$store.commit('SET_BUCKET_GITREPO_LIST_PER_PAGE', newPerPage)
        this.$store.commit('SET_BUCKET_GITREPO_LIST_PAGE', 1)
        await this.repoListUpdate()
      },

      async getRepoList() {
        await this.$store.dispatch('getGitRepoList', {
          bucketId: this.currentBucketId,
        })
      },
    },

    async created() {
      await this.repoListUpdate()
    },
  }
</script>
