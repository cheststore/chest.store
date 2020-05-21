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
        .col-xl-4.order-xl-2.mb-5.mb-xl-0
          .card.card-profile.shadow
            .row.justify-content-center
              .col-lg-3.order-lg-2
                .card-profile-image
                  a(href='#')
                    img.rounded-circle(src='img/theme/team-4-800x800.jpg')
            .card-header.text-center.border-0.pt-8.pt-md-4.pb-0.pb-md-4
              .d-flex.justify-content-between
                base-button.mr-4(size='sm', type='info') Connect
                base-button.float-right(size='sm', type='default') Message
            .card-body.pt-0.pt-md-4
              .row
                .col
                  .card-profile-stats.d-flex.justify-content-center.mt-md-5
                    div
                      span.heading 22
                      span.description Friends
                    div
                      span.heading 10
                      span.description Photos
                    div
                      span.heading 89
                      span.description Comments
              .text-center
                h3
                  | Jessica Jones
                  span.font-weight-light , 27
                .h5.font-weight-300
                  i.ni.location_pin.mr-2
                  | Bucharest, Romania
                .h5.mt-4
                  i.ni.business_briefcase-24.mr-2
                  | Solution Manager - Creative Tim Officer
                div
                  i.ni.education_hat.mr-2
                  | University of Computer Science
                hr.my-4
                p
                  | Ryan — the name taken by Melbourne-raised, Brooklyn-based Nick Murphy — writes, performs and records all of his own music.
                a(href='#') Show more
        .col-xl-8.order-xl-1
          card(shadow='', type='secondary')
            .bg-white.border-0(slot='header')
              .row.align-items-center
                .col-8
                  h3.mb-0 My account
                .col-4.text-right
                  a.btn.btn-sm.btn-primary(href='#!') Settings
            template
              form(@submit.prevent='')
                h6.heading-small.text-muted.mb-4 User information
                .pl-lg-4
                  .row
                    .col-lg-6
                      base-input(alternative='', label='Username', placeholder='Username', input-classes='form-control-alternative', v-model='model.username')
                    .col-lg-6
                      base-input(alternative='', label='Email address', placeholder='jesse@example.com', input-classes='form-control-alternative', v-model='model.email')
                  .row
                    .col-lg-6
                      base-input(alternative='', label='First name', placeholder='First name', input-classes='form-control-alternative', v-model='model.firstName')
                    .col-lg-6
                      base-input(alternative='', label='Last name', placeholder='Last name', input-classes='form-control-alternative', v-model='model.lastName')
                hr.my-4
                // Address
                h6.heading-small.text-muted.mb-4 Contact information
                .pl-lg-4
                  .row
                    .col-md-12
                      base-input(alternative='', label='Address', placeholder='Home Address', input-classes='form-control-alternative', v-model='model.address')
                  .row
                    .col-lg-4
                      base-input(alternative='', label='City', placeholder='City', input-classes='form-control-alternative', v-model='model.city')
                    .col-lg-4
                      base-input(alternative='', label='Country', placeholder='Country', input-classes='form-control-alternative', v-model='model.country')
                    .col-lg-4
                      base-input(alternative='', label='Postal code', placeholder='Postal code', input-classes='form-control-alternative', v-model='model.zipCode')
                hr.my-4
                // Description
                h6.heading-small.text-muted.mb-4 About me
                .pl-lg-4
                  .form-group
                    base-input(alternative='', label='About Me')
                      textarea.form-control.form-control-alternative(rows='4', placeholder='A few words about you ...') A beautiful Dashboard for Bootstrap 4. It is Free and Open Source.
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    name: 'user-profile',

    computed: mapState({
      userName: (state) =>
        (state.session.user && state.session.user.username) || '',
    }),

    data() {
      return {
        model: {
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          address: '',
          city: '',
          country: '',
          zipCode: '',
          about: '',
        },
      }
    },
  }
</script>
