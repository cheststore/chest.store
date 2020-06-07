<template lang="pug">
  div.row
    div.col-lg-4.mb-1
      stats-card(
        title="Object Size"
        type="gradient-orange"
        :sub-title="humanFileSize(sizeBytes || 0)"
        icon="ni ni-box-2"
        class="mb-4")
        //- template(slot="footer")
        //-   span.text-success.mr-2
        //-     i.fa.fa-arrow-up
        //-     | 3.48%
        //-   span.text-nowrap Since last month
    div.col-lg-4.mb-1
      stats-card(
        title="Versions"
        type="gradient-green"
        :sub-title="`${totalVersions}`"
        icon="ni ni-bullet-list-67"
        class="mb-4")
        //- template(slot="footer")
        //-   span.text-success.mr-2
        //-     i.fa.fa-arrow-up
        //-     | 3.48%
        //-   span.text-nowrap Since last month
    div.col-lg-4.mb-1
      stats-card(
        title="Last Updated"
        type="gradient-default"
        :sub-title="getFormattedDate(lastModified, 'YYYY-MM-DD')"
        icon="ni ni-watch-time"
        class="text-nowrap mb-4")
        //- template(slot="footer")
        //-   span.text-success.mr-2
        //-     i.fa.fa-arrow-up
        //-     | 3.48%
        //-   span.text-nowrap Since last month
</template>
<script>
  import StringHelpers from '../factories/StringHelpers'
  import TimeHelpers from '../factories/TimeHelpers'

  export default {
    name: 'file-detail-stats',

    props: {
      sizeBytes: { type: [Number, String] },
      totalVersions: { type: [Number, String] },
      lastModified: { type: [Date, String] },
    },

    methods: {
      getFormattedDate: TimeHelpers.getFormattedDate,
      humanFileSize: StringHelpers.humanFileSize,
    },
  }
</script>
