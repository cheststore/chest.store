<template lang="pug">
  b-dropdown.select-dropdown-filter(variant="link",toggle-class="p-0 text-decoration-none",:right="(dropdownRight) ? true : false",no-caret)
    template(v-slot:button-content)
      div.d-flex.align-items-center.dropdown-toggle.clickable(data-toggle="dropdown",:style="currentStyle",:class="currentCssClass")
        i.mr-1(v-if="icon",:class="[icon, currentCssClass]",:style="currentStyle")
        div.mr-1(v-html="dropdownText")
    b-dropdown-item(@click="updateVal(null, true)") Clear...
    b-dropdown-item(v-for="(opt, ind) in options",:key="ind",@click="updateVal(opt)")
      div.d-flex.align-items-center(:style="getOptionStyle(opt)")
        div.w-100 {{ opt.text }}
        div.ml-auto(v-if="isValueSelected(opt.value)")
          i.fa.fa-check-circle.text-success.ml-2
</template>

<script>
  export default {
    name: 'select-dropdown-filter',

    props: {
      value: { validator: () => true },
      options: { type: Array },
      icon: { type: String, default: null },
      text: { type: String, default: null },
      clearFilterVal: {
        type: [Boolean, Number, Object, String],
        default: null,
      },
      dropdownRight: { type: Boolean, default: false },
      multi: { type: Boolean, default: false },
    },

    computed: {
      currentStyle() {
        const color = this.getOptionColor()
        if (color)
          return {
            color:
              color.indexOf('#') === 0
                ? color
                : this.$store.state.dashboard.colors[color],
          }

        return {}
      },

      currentCssClass() {
        const variantOrColor = this.getOptionColor(true)
        if (!variantOrColor) return ''

        if (variantOrColor.indexOf('#') === 0) return variantOrColor

        return `text-${variantOrColor}`
      },

      dropdownText() {
        if (this.multi)
          return (
            this.options
              .filter(this.valueFindFunction)
              .map((o) => o.text)
              .join('<br>') || this.text
          )

        return (
          (this.options.find(this.valueFindFunction) || {}).text || this.text
        )
      },
    },

    methods: {
      getClearValue() {
        return this.multi ? [] : this.clearFilterVal
      },

      getOptionStyle(option) {
        return option.color ? { color: option.color } : {}
      },

      valueFindFunction(opt) {
        if (this.multi) return (this.value || []).includes(opt.value)

        return opt.value === this.value
      },

      isValueSelected(value) {
        return this.multi
          ? (this.value || []).includes(value)
          : this.value === value
      },

      getOptionColor(isColorClass = false) {
        const opt = this.options.find(this.valueFindFunction) || {}
        if (isColorClass) return opt.colorClass || opt.variant

        return opt.color
      },

      updateVal(option, clearValue = false) {
        let newVal = (option || {}).value
        if (clearValue) {
          newVal = this.getClearValue()
        } else if (this.multi) {
          newVal = [...(this.value || [])]

          if (newVal.includes(option.value)) {
            const ind = newVal.findIndex((v) => v === option.value)
            newVal.splice(ind, 1)
          } else {
            newVal.push(option.value)
          }
        }

        this.$emit('input', newVal)
        this.$emit('change', newVal)
      },
    },
  }
</script>

<style lang="scss">
  .select-dropdown-filter {
    .dropdown-menu {
      overflow-y: auto;
      max-height: 300px;
    }
  }
</style>
