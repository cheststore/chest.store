<template lang="pug">
  modal(
    :show.sync="showModal"
    :gradient="variant"
    :modal-classes="`modal-${variant}`"
    @close="$emit('close')")
    template(slot='header')
      h5.modal-title {{ header }}
    div
      div(v-html="text")
    template(slot='footer')
      base-button(type='link',text-color="white",@click="$emit('close')") Cancel
      base-button.ml-auto(type='white',@click="confirm") Confirm
</template>

<script>
  export default {
    name: 'confirmation-modal',

    props: {
      text: { type: String, required: true },
      show: { type: Boolean, required: true },
      header: { type: String, default: 'Confirm' },
      variant: { type: String, default: 'primary' },
    },

    watch: {
      show(bool) {
        this.showModal = bool
      },
    },

    data() {
      return {
        showModal: false,
      }
    },

    methods: {
      confirm() {
        this.$emit('confirm')
      },
    },
  }
</script>
