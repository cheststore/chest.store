<template lang="pug">
  div
    div(:class="providerType ? 'mb-4' : 'mb-9'")
      base-dropdown.w-100(position="bottom")
        base-button.w-100.dropdown-toggle.d-flex.align-items-center.justify-content-center(
          slot="title"
          type="secondary")
          span.avatar.avatar-sm.rounded-circle.bg-white.mr-2(v-if="providerType")
            img.img-fluid.img-thumbnail(:src="types.find(t => t.value === providerType).img_icon_path")
          div {{ providerType ? types.find(t => t.value === providerType).text : 'Select provider' }}
        a.dropdown-item.d-flex.align-items-center(v-for="t in types",@click="providerType = t.value")
          span.avatar.avatar-sm.rounded-circle.bg-white.mr-2(v-if="t.img_icon_path")
            img.img-fluid.img-thumbnail(:src="t.img_icon_path")
          div {{ t.text }}

    component(
      v-if="providerType"
      :is="typeProviderComponentMap[providerType]"
      @created="$emit('created')")

</template>

<script>
  import { mapState } from 'vuex'
  import AwsProvider from './AwsProvider'
  import DropboxProvider from './DropboxProvider'
  import FsProvider from './FsProvider'
  import GcpProvider from './GcpProvider'

  export default {
    data() {
      return {
        providerType: null,

        typeProviderComponentMap: {
          aws: AwsProvider,
          dropbox: DropboxProvider,
          fs: FsProvider,
          gcp: GcpProvider,
        },
      }
    },

    computed: mapState({
      types: (_, getters) => getters.getActiveProviderTypes,
    }),

    components: {
      AwsProvider,
      DropboxProvider,
      FsProvider,
      GcpProvider,
    },
  }
</script>
