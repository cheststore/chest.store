<template lang="pug">
  div
    base-header.header.pb-8.pt-5.pt-lg-8.d-flex.align-items-center
      // Mask
      span.mask.bg-gradient-success.opacity-8
      // Header container
      .container-fluid
        .row
          .col-lg-7.col-md-10
            h1.display-2.text-white Hello {{ userName }}
            //- p.text-white.mt-0.mb-5
            //-   | This is your profile page. You can see the progress you've made with your work and manage your projects or assigned tasks
            //- a.btn.btn-info(href='#!') Edit profile
    .container-fluid.mt--7
      .row
        //- .col-xl-4.order-xl-2.mb-5.mb-xl-0
        //-   .card.card-profile.shadow
        //-     .row.justify-content-center
        //-       .col-lg-3.order-lg-2
        //-         .card-profile-image
        //-           a(href='#')
        //-             img.rounded-circle(src='img/theme/team-4-800x800.jpg')
        //-     .card-header.text-center.border-0.pt-8.pt-md-4.pb-0.pb-md-4
        //-       .d-flex.justify-content-between
        //-         base-button.mr-4(size='sm', type='info') Connect
        //-         base-button.float-right(size='sm', type='default') Message
        //-     .card-body.pt-0.pt-md-4
        //-       .row
        //-         .col
        //-           .card-profile-stats.d-flex.justify-content-center.mt-md-5
        //-             div
        //-               span.heading 22
        //-               span.description Friends
        //-             div
        //-               span.heading 10
        //-               span.description Photos
        //-             div
        //-               span.heading 89
        //-               span.description Comments
        //-       .text-center
        //-         h3
        //-           | Jessica Jones
        //-           span.font-weight-light , 27
        //-         .h5.font-weight-300
        //-           i.ni.location_pin.mr-2
        //-           | Bucharest, Romania
        //-         .h5.mt-4
        //-           i.ni.business_briefcase-24.mr-2
        //-           | Solution Manager - Creative Tim Officer
        //-         div
        //-           i.ni.education_hat.mr-2
        //-           | University of Computer Science
        //-         hr.my-4
        //-         p
        //-           | Ryan — the name taken by Melbourne-raised, Brooklyn-based Nick Murphy — writes, performs and records all of his own music.
        //-         a(href='#') Show more
        .col-xl-6.offset-lg-3.order-xl-1
          card(shadow='', type='secondary')
            .bg-white.border-0(slot='header')
              .row.align-items-center
                .col-8
                  h3.mb-0 My account
                //- .col-4.text-right
                //-   a.btn.btn-sm.btn-primary(href='#!') Settings
            template
              form(@submit.prevent='')
                h6.heading-small.text-muted.mb-4 User information
                .pl-lg-4
                  .row
                    .col-lg-6
                      base-input(alternative='', label='Username', placeholder='Username', input-classes='form-control-alternative', v-model='userName')
                    .col-lg-6
                      base-input(alternative='', label='Email address', placeholder='jesse@example.com', input-classes='form-control-alternative', v-model='userEmail')
                  .row
                    .col-lg-6
                      base-input(alternative='', label='First name', placeholder='First name', input-classes='form-control-alternative', v-model='userFirstName')
                    .col-lg-6
                      base-input(alternative='', label='Last name', placeholder='Last name', input-classes='form-control-alternative', v-model='userLastName')
                  .row
                    .col-12.d-flex.justify-content-center
                      base-button(type="success",@click="updateSelf") Save Profile
                hr.my-4
                // Providers
                h6.heading-small.text-muted.mb-4 Your Buckets
                div.row
                  div.col-lg-12
                    div.card.shadow
                      div.card-header.py-2.d-flex.align-items-center
                        h4.mb-0 Buckets
                        div.ml-auto
                          base-button(
                            size='sm'
                            type='success'
                            @click="showAddProviderModal = true") Add Provider
                      div.table-responsive.mb-0
                        base-table.table.align-items-center.table-flush(
                          thead-classes="thead-light"
                          tbody-classes="list"
                          no-data-placeholder="No buckets available..."
                          :data="allBuckets")
                          template(slot="columns")
                            th.py-1 Buckets
                          template(slot-scope="{row}")
                            td.py-1
                              div.d-flex.align-items-center
                                span.avatar.avatar-sm.rounded-circle.bg-white.mr-2(v-if="getProviderType(row.type)")
                                  img.img-fluid.img-thumbnail(:src="getProviderType(row.type).img_icon_path")
                                div
                                  div.d-flex.align-items-center.small.text-light
                                    div {{ row.name }}
                                    //- div.ml-auto.text-gray
                                    //-   | {{ getFormattedDate(row.date, 'YYYY-MM-DD') }}
                                  div
                                    strong {{ row.bucket_uid }}
                                div.ml-auto.text-light
                                  div.ml-2 {{ getProviderType(row.type).text }}
                hr.my-4
                h6.heading-small.text-muted.mb-4
                  | API Key
                div.pl-lg-4
                  div.row
                    div.col-lg-12.text-center #[strong {{ userApiKey }}]
                //- .pl-lg-4
                //-   .form-group
                //-     base-input(alternative='', label='About Me')
                //-       textarea.form-control.form-control-alternative(rows='4', placeholder='A few words about you ...') A beautiful Dashboard for Bootstrap 4. It is Free and Open Source.

    add-provider-modal(
      :show="showAddProviderModal"
      @close="showAddProviderModal = false"
      @created="providerAdded")
</template>

<script>
  import { mapState } from 'vuex'
  import ApiAuth from '../factories/ApiAuth'

  export default {
    name: 'user-settings',

    computed: {
      ...mapState({
        allBuckets: (state) => Object.values(state.session.buckets || {}),
        providerTypes: (state) => state.providerTypes,
        userApiKey: (state) => state.userApiKeys[0].key,
      }),

      userEmail: {
        get() {
          return (
            (this.$store.state.session.user &&
              this.$store.state.session.user.email_address) ||
            ''
          )
        },

        set(newVal) {
          this.$store.commit('SET_USER_KEY', {
            key: 'email_address',
            value: newVal,
          })
        },
      },

      userFirstName: {
        get() {
          return (
            (this.$store.state.session.user &&
              this.$store.state.session.user.first_name) ||
            ''
          )
        },

        set(newVal) {
          this.$store.commit('SET_USER_KEY', {
            key: 'first_name',
            value: newVal,
          })
        },
      },

      userLastName: {
        get() {
          return (
            (this.$store.state.session.user &&
              this.$store.state.session.user.last_name) ||
            ''
          )
        },

        set(newVal) {
          this.$store.commit('SET_USER_KEY', {
            key: 'last_name',
            value: newVal,
          })
        },
      },

      userName: {
        get() {
          return (
            (this.$store.state.session.user &&
              this.$store.state.session.user.username) ||
            ''
          )
        },

        set(newVal) {
          this.$store.commit('SET_USER_KEY', { key: 'username', value: newVal })
        },
      },
    },

    data() {
      return {
        newProviderType: null,
        showAddProviderModal: false,
      }
    },

    methods: {
      getProviderType(type) {
        return this.providerTypes.find((t) => t.value === type) || {}
      },

      async providerAdded() {
        this.showAddProviderModal = false
        await this.$store.dispatch('getUserSession', true)
      },

      async updateSelf() {
        await ApiAuth.selfUpdate({
          username: this.userName,
          email_address: this.userEmail,
          first_name: this.first_name,
          last_name: this.last_name,
        })
        this.$notify('Successfully updated your profile!')
      },
    },
  }
</script>
