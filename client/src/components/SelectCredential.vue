<template lang="pug">
  select-dropdown-filter(
    v-if="credentials && credentials.length > 0"
    :value="value"
    @input="selectCred"
    :multi="false"
    :icon="`fa ${icon}`"
    text="Select existing key..."
    :dropdown-right="false"
    :clear-filter-val="null"
    :options="credentials.map(c => ({ value: c, text: c.key }))")
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    name: 'select-credential',

    props: {
      type: { type: String, required: true },
      value: { type: String, default: null },
      icon: { type: String, default: 'fa-user-circle' },
    },

    computed: mapState({
      credentials(state) {
        return Object.values(state.session.credentials).filter(
          (c) => c.type === this.type
        )
      },
    }),

    methods: {
      selectCred(credId) {
        this.$emit('input', credId)
      },
    },
  }
</script>
