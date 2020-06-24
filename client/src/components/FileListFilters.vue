<template lang="pug">
  div.row
    div.d-flex.align-items-center.border-right(v-if="allBuckets && allBuckets.length > 0",:class="search ? 'col-lg-7' : 'col-12'")
      select-dropdown-filter(
        v-model="currentBucketId",
        :class="currentBucketId && 'filter-active'",
        :multi="false",
        icon="fa fa-popcorn",
        text="Select Bucket",
        :dropdown-right="false",
        :clear-filter-val="null",
        :options="allBuckets.map(b => ({ value: b.id, text: `${getProviderType(b.type).text || 'N/A'}: ${b.name}` }))")
      label.mb-0.ml-3
        //- div.card
        //-   div.card-body.p-2
        base-checkbox.nowrap(v-model="includeAllBuckets") Browse all buckets?
      //- select#current-bucket.form-control.form-control-sm(v-model="currentBucketId")
      //-   option(v-for="bucket in allBuckets",:value="bucket.id")
      //-     | {{ bucket.name }} ({{ getProviderType(bucket.type).text || 'N/A' }})
    div.col(v-if="search")
      base-input.m-0(
        v-model="searchQuery"
        label-classes="mb-0"
        :valid="(searchQuery && searchQuery.length > 0) || null"
        placeholder="Search for objects...")
</template>
<script>
  import { mapState } from 'vuex'
  import ApiAuth from '../factories/ApiAuth'
  import { debounce } from '../factories/Utilities'

  export default {
    name: 'file-list-filters',

    props: {
      search: { type: Boolean, default: false },
    },

    data() {
      return {
        objectListUpdateDelay: debounce(() => {
          this.$emit('update')
        }, 300),
      }
    },

    computed: {
      ...mapState({
        allBuckets: (state) => state.session.buckets,
        currentBucket: (state) => state.session.current_bucket,
        providerTypes: (state) => state.providerTypes,
      }),

      currentBucketId: {
        get() {
          return this.includeAllBuckets ? null : this.currentBucket.id
        },

        async set(newId) {
          await ApiAuth.selfUpdate({ current_bucket_id: newId })
          await this.$store.dispatch('getUserSession', true)

          // NOTE: setter function for this var will refresh the list (see below)
          this.includeAllBuckets = false
        },
      },

      includeAllBuckets: {
        get() {
          return this.$store.state.objects.includeAllBuckets
        },

        async set(bool) {
          this.$store.commit('SET_INCLUDE_ALL_BUCKETS', bool)
          this.$emit('update')
        },
      },

      searchQuery: {
        get() {
          return this.$store.state.objects.currentListFilters.searchQuery
        },

        async set(value) {
          this.$store.commit('SET_BUCKET_OBJECT_FILTER', {
            key: 'searchQuery',
            value,
          })
          await this.objectListUpdateDelay()
        },
      },
    },

    methods: {
      getProviderType(type) {
        return this.providerTypes.find((t) => t.value === type) || {}
      },
    },
  }
</script>
