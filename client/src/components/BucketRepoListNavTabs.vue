<template lang="pug">
  div.nav-wrapper
    ul.nav.nav-pills.nav-pills-circle(role="tablist")
      li.nav-item(v-if="isGitPath",:id="`bucket-repo-nav-${_uid}-bucket`")
        router-link.nav-link.active(to="/bucket")
          i.ni.ni-image
      li.nav-item(v-else,:id="`bucket-repo-nav-${_uid}-git`")
        router-link.nav-link.active(to="/repos")
          i.fab.fa-git-alt

    b-tooltip(:target="`bucket-repo-nav-${_uid}-bucket`")
      | Go to object explorer
    b-tooltip(:target="`bucket-repo-nav-${_uid}-git`")
      | Go to git repository list
</template>

<script>
  export default {
    name: 'bucket-repo-list-nav-tabs',

    computed: {
      isGitPath() {
        return /^\/repo/.test(this.$route.path)
      },
    },
  }
</script>

<style lang="scss" scoped>
  .nav-wrapper {
    padding-top: 0px;
    padding-bottom: 0px;

    .nav-pills-circle .nav-link {
      line-height: 40px;
      height: 40px;
      width: 40px;
    }
  }
</style>
