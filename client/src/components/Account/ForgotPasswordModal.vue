<template lang="pug">
  modal(:show.sync='showModal' @close="$emit('close')")
    template(slot='header')
      h5#exampleModalLabel.modal-title Forgot Password
    div
      base-alert(v-if="!!forgot.error && !forgot.success",type="danger") {{ forgot.error }}
      base-alert(v-if="!!forgot.success",type="success") {{ forgot.success }}
      base-input(
        v-model="forgot.email"
        :alternative="true"
        placeholder="Email Address"
        addon-left-icon="ni ni-email-83")
    template(slot='footer')
      base-button(type='secondary',@click="$emit('close')") Cancel
      base-button(type='primary',@click="forgotPassword") Create Temp Password
</template>

<script>
  import { sleep } from '../../factories/Utilities'
  import ApiAuth from '../../factories/ApiAuth'

  export default {
    props: {
      show: { type: Boolean }
    },

    watch: {
      show(newVal) {
        this.showModal = newVal
      }
    },
    
    data() {
      return {
        showModal: false,

        forgot: {
          email: null,
          error: null,
          success: null
        }
      }
    },

    methods: {
      async forgotPassword(evt) {
        try {
          evt.preventDefault()

          if (!ApiAuth.isValidEmail(this.forgot.email))
            return this.forgot.error = `Please enter a valid e-mail address to send a temporary password to.`

          this.forgot.success = null
          this.forgot.error = null
          await ApiAuth.forgotPassword(this.forgot.email)
          this.forgot.success = `Success! Check your email shortly for your temporary password to login.`
          
          await sleep(1500)
          this.showModal = false
          this.forgot.error = this.forgot.success = null
        } catch(err) {
          this.forgot.error = err.message
        }
      }
    }
  }
</script>
