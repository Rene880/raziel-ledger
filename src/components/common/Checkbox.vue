<template>
  <div
    @click="changeValue()"
    class="select-none flex flex-row flex-nowrap items-center"
    :class="getClasses"
  >
    <!-- Box -->
    <fa-icon v-if="modelValue === true" :icon="on" :class="iconSize"></fa-icon>
    <fa-icon v-else :icon="off" :class="iconSize"></fa-icon>
    <!-- Label -->
    <span class="ml-1 my-1 text-primary">
      <slot></slot>
    </span>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    on: {
      type: Array,
      default: () => ['fa', 'toggle-on']
    },
    off: {
      type: Array,
      default: () => ['fa', 'toggle-off']
    },
    iconSize: {
      type: String,
      default: 'text-4xl'
    }
  },
  emits: ['update:modelValue'],
  methods: {
    changeValue() {
      if ( ! this.disabled) {
        this.$emit('update:modelValue', ! this.modelValue);
      }
    }
  },
  computed: {
    getClasses() {
      let classes = this.modelValue ? 'text-blue-300 ' : 'text-rose-400 ';
      if (this.disabled) {
        classes += ' cursor-not-allowed grayscale-70 opacity-70 ';
      }
      else {
        classes += 'cursor-pointer hover:underline hover:decoration-2 ';
        classes += this.modelValue ?
          'hover:text-blue-400 hover:decoration-blue-400 ' :
          'hover:text-rose-600 hover:decoration-rose-600 ';
      }
      return classes;
    }
  }
}
</script>
