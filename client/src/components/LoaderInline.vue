<template lang="pug">
  i.fa.fa-spinner.fa-spin(:class="getSizeClass()")
</template>

<script>
  export default {
    name: 'loader-inline',

    props: {
      size: { type: [Number, String], default: null },
    },

    methods: {
      getSizeClass() {
        return this.size ? `fa-${this.size}x` : ''
      },
    },
  }
</script>
