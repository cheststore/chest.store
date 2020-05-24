<template lang="pug">
  div.row.justify-content-center
    div.col-lg-5.col-md-7
      add-provider(@created="$router.push('/')")
</template>

<script>
  import AddProvider from './AddProvider'

  export default {
    components: {
      AddProvider,
    },
  }
</script>
