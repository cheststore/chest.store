<template lang="pug">
  form(@submit="checkAndSaveDirectory")
    div.card.bg-secondary.shadow.border-0
      div.card-header.border-0
        h3.m-0 File System Base Directory
      div.card-body.py-lg-3.px-lg-5
        div.small.mb-3
          | The base directory is a directory on your machine/server's
          | file system (i.e. the machine that chest.store is installed on)
          | that you'd like to manage and store version history using
          | chest.store. Please enter an absolute file path to the
          | directory on your file system.
        base-input.input-group-alternative(
          v-model="baseDir"
          placeholder="Base Directory")

</template>

<script>
  import ApiProviders from '../../factories/ApiProviders'

  export default {
    data() {
      return {
        baseDir: null,
      }
    },

    methods: {
      async checkAndSaveDirectory(evt) {
        try {
          evt.preventDefault()

          if (!this.baseDir)
            return this.$notify({
              type: 'danger',
              message: `Please enter a base directory to use.`,
            })

          await ApiProviders.checkAndSaveFsDir(this.baseDir)
          await this.$store.dispatch('getUserSession', true)
          this.$emit('created')
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },
  }
</script>
