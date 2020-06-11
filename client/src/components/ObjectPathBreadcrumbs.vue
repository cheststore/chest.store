<template lang="pug">
  div.d-flex.align-items-center(v-if="path")
    template(v-for="(crumb, ind) in crumbs")
      router-link(:to="crumb.link") {{ crumb.text }}
      div.mx-2(v-if="ind < crumbs.length - 1") /
</template>

<script>
  import ApiCloudObjects from '../factories/ApiCloudObjects'

  export default {
    name: 'object-path-breadcrumbs',

    props: {
      currentDirectoryId: { type: String, default: null },
      path: { type: String, default: null },
    },

    watch: {
      async currentDirectoryId() {
        await this.getHierarchy()
      },
    },

    data() {
      return {
        directories: [],
      }
    },

    computed: {
      crumbs() {
        const pathAry = this.path.split('/').filter((p) => !!p)
        return pathAry.map((part, ind) => {
          const dir = this.directories.find((d) => d.cname === part)
          return {
            text: part,
            link: ind === 0 || !dir ? '/bucket' : `/directory/${dir.cid}`,
          }
        })
      },
    },

    methods: {
      async getHierarchy() {
        try {
          if (this.currentDirectoryId) {
            const { directories } = await ApiCloudObjects.getDirectoryHierarchy(
              this.currentDirectoryId
            )
            this.directories = directories.reverse()
          }
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },

    async created() {
      await this.getHierarchy()
    },
  }
</script>
