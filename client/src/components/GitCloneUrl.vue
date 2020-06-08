<template lang="pug">
  pre.mb-0(v-highlightjs)
    code.sh $ git clone {{ cloneUrl }}/git/{{ username }}/{{ repoName }}
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    name: 'git-clone-url',

    props: {
      repoName: { type: String, default: '/' },
    },

    computed: {
      ...mapState({
        username: (state) => state.session.user.username,
      }),

      cloneUrl() {
        return `${location.origin}`
      },
    },
  }
</script>
