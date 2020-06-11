<template lang="pug">
  div
    base-button(:id="`file-link-${_uid}`" type="primary" size="sm" icon="fa fa-link")
    //- b-tooltip(:target="`file-link-${_uid}`")
    //-   | Create and share public links to download this file/object to
    //-   | others without chest.store accounts.
    b-popover(:target="`file-link-${_uid}`")
      template(slot="title")
        div.text-primary Public Links to Download File
      div.small
        small
          | The following links can be shared and sent to other users
          | to download this file without authenticating with chest.store.
      div.mt-2
        i(v-if="links.length === 0") No external links created yet...
        ul.list-unstyled(v-else)
          li.mb-2(v-for="(link, ind) in links")
            div.d-flex.align-items-center
              pre.border.p-1.mb-0
                code.sh {{ downloadLink(link.id) }}
              a(@click="deleteLink(link.id)")
                i.ml-2.text-danger.fa.fa-times
      div.d-flex.justify-content-center
        base-button(type="primary" size="sm" @click="createLink") Create New Link
</template>

<script>
  import { mapState } from 'vuex'
  import ApiLinks from '../factories/ApiLinks'

  export default {
    name: 'file-link-icon',

    props: {
      entityTable: { type: String, required: true },
      entityId: { type: String, required: true },
      path: { type: String, default: null },
    },

    watch: {
      async entityTable() {
        await this.getLinks()
      },

      async entityId() {
        await this.getLinks()
      },

      async path() {
        await this.getLinks()
      },
    },

    data() {
      return {
        links: [],
        // newLink: {
        //   expiration: ``
        // }
      }
    },

    computed: mapState({
      username: (state) => state.session.user.username,
    }),

    methods: {
      downloadLink(linkId) {
        return `${location.origin}/link/download/${linkId}`
      },

      async getLinks() {
        try {
          const { links } = await ApiLinks.getForEntity(
            this.entityTable,
            this.entityId,
            this.path
          )
          this.links = links
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },

      async createLink() {
        try {
          await ApiLinks.createUpdateLink({
            // id,
            entityTable: this.entityTable,
            entityId: this.entityId,
            extraIdentifyingInfo: this.path,
            // password,
            // expiration,
          })
          await this.getLinks()
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },

      async deleteLink(id) {
        try {
          await ApiLinks.deleteLink(id)
          await this.getLinks()
        } catch (err) {
          this.$notify({ type: 'danger', message: err.message })
        }
      },
    },

    async created() {
      await this.getLinks()
    },
  }
</script>
