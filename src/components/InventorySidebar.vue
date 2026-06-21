<template>
  <div class="fixed top-20 right-0 z-40 flex flex-row items-start">
    <!-- Toggle handle (always visible) -->
    <button
      class="btn btn-blue rounded-r-none px-2 py-3"
      :title="open ? 'Hide supplies' : 'Show supplies inventory'"
      @click="$emit('update:open', !open)">
      <fa-icon :icon="['fas', open ? 'angle-right' : 'warehouse']"></fa-icon>
    </button>

    <!-- Panel -->
    <div v-if="open"
      class="flex flex-col bg-tertiary text-primary border-4 border-r-0 border-secondary rounded-l shadow-lg w-72 max-h-[70vh]">
      <div class="flex flex-row justify-between items-center p-3 border-b border-secondary">
        <h2 class="text-lg font-bold">Supplies</h2>
        <a class="cursor-pointer" @click="$emit('update:open', false)" title="Close">
          <fa-icon :icon="['fas', 'xmark']"></fa-icon>
        </a>
      </div>

      <p v-if="! items.length" class="p-3 text-sm opacity-70">
        No supplies imported yet — use
        <fa-icon :icon="['fas', 'file-import']"></fa-icon> Import supplies in the menu.
      </p>

      <ul v-else class="flex flex-col overflow-y-auto p-2 gap-1">
        <li v-for="item in items" :key="item.key"
          class="flex flex-row items-center gap-2 px-1 py-0.5 rounded"
          :class="item.remaining === 0 ? 'opacity-50' : ''">
          <img :src="imgUrl(item)" style="height: 32px; width: 32px;" class="shrink-0">
          <a :href="'https://gbf.wiki/' + item.name" target="_blank"
            class="text-sm grow truncate hover:text-link-hover" :title="item.name">
            {{ item.name }}
          </a>
          <span class="text-sm whitespace-nowrap" :class="item.remaining === 0 ? 'text-red-400' : ''">
            {{ item.remaining }} / {{ item.owned }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import inventory from '@/js/inventory'

export default {
  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:open'],
  computed: {
    items() {
      // Re-evaluates when stock/owned change (the method reads reactive state).
      return inventory.inventoryList();
    },
  },
  methods: {
    imgUrl(item) {
      return import.meta.env.BASE_URL + 'img/item/' + item.key + (item.animated ? '.gif' : '.jpg');
    },
  },
};
</script>
