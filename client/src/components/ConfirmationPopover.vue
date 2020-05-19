<template lang="pug">
  b-popover(
    :target="target",
    :ref="target"
  )
    template(slot="title")
      div.d-flex.align-items-center
        h6.m-0 {{ header }}
        div.ml-auto
          i.fa.fa-times.clickable(@click="confirm('cancel')")
    div {{ text }}

    div.mt-2.d-flex.justify-content-center
      button.btn-vsm.btn-primary.mr-2(@click="confirm('cancel')") Cancel
      button.btn-vsm.btn-danger(@click="confirm('confirm')") Confirm
</template>

<script>
  export default {
    name: 'confirmation-popover',

    props: {
      target: { type: String, required: true },
      text: { type: String, required: true },
      header: { type: String, default: 'Confirm' },
    },

    methods: {
      confirm(action) {
        this.$emit(action)
        this.$refs[this.target].$emit('close')
      },
    },
  }
</script>
