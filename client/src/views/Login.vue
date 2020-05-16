<template>
  <div class="row justify-content-center">
    <div class="col-lg-5 col-md-7">
      <div class="card bg-secondary shadow border-0">
        <!-- <div class="card-header bg-transparent pb-5">
          <div class="text-muted text-center mt-2 mb-3">
            <small>Sign up with</small>
          </div>
          <div class="btn-wrapper text-center">
            <a href="#" class="btn btn-neutral btn-icon">
              <span class="btn-inner--icon"><img src="/public/img/icons/common/github.svg"></span>
              <span class="btn-inner--text">Github</span>
            </a>
            <a href="#" class="btn btn-neutral btn-icon">
              <span class="btn-inner--icon"><img src="/public/img/icons/common/google.svg"></span>
              <span class="btn-inner--text">Google</span>
            </a>
          </div>
        </div> -->
        <div
          :class="(errorMessage ? ['py-lg-3'] : ['py-lg-5']).concat(['card-body', 'px-lg-5'])">
          <!-- <div class="text-center text-muted mb-4">
            <small>Or sign up with credentials</small>
          </div> -->

          <base-alert
            v-if="errorMessage"
            class="my-4"
            type="danger">{{ errorMessage }}</base-alert>

          <form role="form" :action="getFormAction" method="post">

            <base-input 
                  id="username"
                  name="username"
                  class="input-group-alternative"
                  placeholder="Username"
                  addon-left-icon="ni ni-hat-3"
                  v-model="username">
            </base-input>

            <!-- <base-input class="input-group-alternative mb-3"
                  placeholder="Email"
                  addon-left-icon="ni ni-email-83"
                  v-model="model.email">
            </base-input> -->

            <base-input 
                  id="password"
                  name="password"
                  class="input-group-alternative mb-3"
                  placeholder="Password"
                  type="password"
                  addon-left-icon="ni ni-lock-circle-open"
                  v-model="password">
            </base-input>

            <base-input 
                  v-if="createAccount"
                  id="cpassword"
                  name="cpassword"
                  class="input-group-alternative mb-3"
                  placeholder="Confirm Password"
                  type="password"
                  addon-left-icon="ni ni-lock-circle-open"
                  v-model="cpassword">
            </base-input>

            <!-- <div class="text-muted font-italic">
              <small>password strength: <span class="text-success font-weight-700">strong</span></small>
            </div> -->

            <!-- <div class="row my-4">
              <div class="col-12">
                <base-checkbox class="custom-control-alternative">
                  <span class="text-muted">I agree with the <a href="#!">Privacy Policy</a></span>
                </base-checkbox>
              </div>
            </div> -->
            <div class="text-center">
              <base-button
                native-type="submit"
                type="primary"
                class="my-4">{{ createAccount ? 'Create account' : 'Login' }}</base-button>
            </div>
          </form>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-6">
          <!-- <a @click="showForgot = true" class="text-light">
            <small>Forgot password?</small>
          </a> -->
        </div>
        <div class="col-6 text-right">
          <router-link :to="createAccount ? '/account/login' : '/account/register'" class="text-light">
            <small>{{ createAccount ? 'Login into your account' : 'Register a new account' }}</small>
          </router-link>
        </div>
      </div>
    </div>

    <forgot-password-modal
      id="forgot-password-modal"
      :show="showForgot"
      @close="showForgot = false"></forgot-password-modal>
  </div>
</template>

<script>
  import ForgotPasswordModal from '@/components/Account/ForgotPasswordModal'
  import ErrorMessages from '@/factories/ErrorMessages'

  export default {
    props: {
      type: { type: String, default: 'login' },
      error: { type: String, default: null }
    },

    data() {
      return {
        showForgot: false,

        username: null,
        password: null,
        cpassword: null
      }
    },

    computed: {
      createAccount() {
        return this.type === 'register'
      },

      getFormAction() {
        return this.createAccount
          ? '/api/1.0/auth/create/user'
          : '/auth/local'
      },

      errorMessage() {
        return this.error && ErrorMessages[this.error].toString() === '[object Object]'
          ? ErrorMessages[this.error].error
          : ErrorMessages[this.error]
      }
    },

    components: {
      ForgotPasswordModal
    }
  }
</script>
