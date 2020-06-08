<template lang="pug">
  div.d-flex.align-items-center(v-if="path")
    template(v-for="(crumb, ind) in crumbs")
      router-link(:to="crumb.link") {{ crumb.text }}
      div.mx-2(v-if="ind < crumbs.length - 1") /
</template>

<script>
  export default {
    name: 'git-path-breadcrumbs',

    props: {
      repoId: { type: String, required: true },
      repoName: { type: String, default: '/' },
      path: { type: String, default: null },
    },

    computed: {
      crumbs() {
        const pathAry = [
          this.repoName,
          ...this.path.split('/').filter((p) => !!p),
        ]
        return pathAry.map((part, ind) => {
          return {
            text: part,
            link:
              ind === pathAry.length - 1
                ? ''
                : `/repo/${this.repoId}/${pathAry.slice(1, ind + 1).join('/')}`,
          }
        })
      },
    },
  }
</script>
