<template lang="pug">
  modal(
    :show.sync="showModal"
    gradient="info"
    @close="$emit('close')")
    template(slot='header')
      h5.modal-title.text-white Add Provider
    div
      add-provider(@created="$emit('close')")
    template(slot='footer')
      base-button(type='link',text-color="white",@click="$emit('close')") Cancel
      //- base-button.ml-auto(type='white',@click="addProvider") Add Provider
</template>

<script>
  import AddProvider from '../views/AddProvider/AddProvider'

  export default {
    name: 'add-provider-modal',

    props: {
      show: { type: Boolean, required: true },
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

    components: {
      AddProvider,
    },
  }
</script>
