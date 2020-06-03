<template lang="pug">
  div.pdf-wrapper
    div(v-for="index in pageCount")
      pdf.pdf-page(
        :src="src",
        :key="index",
        :page="index",
        @progress="setProgress",
        @error="onError")
</template>

<script>
  import Pdf from 'vue-pdf'

  export default {
    name: 'pdf-viewer',

    props: {
      src: { type: String },
    },

    data() {
      return {
        loadingTask: Pdf.createLoadingTask(this.src).promise,
        currentPage: 0,
        pageCount: 0,
      }
    },

    methods: {
      setProgress(prog) {
        this.$emit('progress', prog)
      },

      onError() {
        this.$emit('error', arguments)
      },
    },

    async mounted() {
      try {
        const pdf = await this.loadingTask
        this.pageCount = pdf.numPages
      } catch (err) {
        this.$emit('error', err)
      }
    },

    components: {
      Pdf,
    },
  }
</script>

<style lang="scss">
  .pdf-wrapper {
    max-height: 800px;
    overflow-y: auto;

    .pdf-page {
      width: 100%;
    }
  }
</style>
