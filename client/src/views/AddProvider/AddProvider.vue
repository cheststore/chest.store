<template lang="pug">
  div.row.justify-content-center
    div.col-lg-5.col-md-7
      div(:class="providerType ? 'mb-4' : 'mb-9'")
        base-dropdown.w-100(position="bottom")
          base-button.w-100.dropdown-toggle(
            slot="title"
            type="secondary"
            data-toggle="dropdown") {{ providerType ? types.find(t => t.value === providerType).text : 'Select provider type' }}
          a.dropdown-item(v-for="t in types",@click="providerType = t.value") {{ t.text }}

      component(
        v-if="providerType",
        :is="typeProviderComponentMap[providerType]")

</template>

<script>
  import { mapState } from 'vuex'
  import AwsProvider from './AwsProvider'
  import FsProvider from './FsProvider'

  export default {
    data() {
      return {
        providerType: null,

        typeProviderComponentMap: {
          aws: AwsProvider,
          fs: FsProvider,
        },
      }
    },

    computed: mapState({
      types: (state) => state.providerTypes,
    }),

    methods: {},

    components: {
      AwsProvider,
      FsProvider,
    },
  }
</script>
