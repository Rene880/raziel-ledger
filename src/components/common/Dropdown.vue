<template>
  <div class="inline-block relative">
    <select :value="modelValue" @change="changeValue" class="block select select-sm w-full" ref="select" :disabled="disabled">
      <slot></slot>
    </select>

    <div v-if="! disabled" class="pointer-events-none absolute inset-y-0 right-0 rounded-md flex items-center px-2 text-gray-700">
      <fa-icon :icon="['fas', 'angle-down']" class="text-xl"></fa-icon>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      required: false
    },
    modelModifiers: {
      type: Object,
      default: () => ({})
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'change'],
  methods: {
    changeValue(e) {
      let value = this.$refs.select.value;
      if (this.modelModifiers.number) {
        value = Number(value);
      }
      this.$emit('change', e);
      this.$emit('update:modelValue', value);
    }
  },
}
</script>
