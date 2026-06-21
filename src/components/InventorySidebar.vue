<template>
  <div class="fixed top-20 right-0 z-40 flex flex-row items-start">
    <!-- Toggle handle (always visible) -->
    <button
      class="bg-tertiary text-primary border-4 border-secondary rounded-r-none px-2 py-3 hover:bg-secondary transition-colors"
      :title="open ? 'Hide supplies' : 'Show supplies inventory'"
      @click="$emit('update:open', !open)">
      <fa-icon :icon="['fas', open ? 'angle-right' : 'warehouse']"></fa-icon>
    </button>

    <!-- Panel -->
    <div v-if="open"
      class="flex flex-col bg-tertiary text-primary border-4 border-r-0 border-secondary rounded-l shadow-lg w-80 h-[calc(100vh-5rem)]">
      <div class="flex flex-row justify-between items-center p-3 border-b border-secondary">
        <h2 class="text-lg font-bold">Supplies</h2>
        <a class="cursor-pointer" @click="$emit('update:open', false)" title="Close">
          <fa-icon :icon="['fas', 'xmark']"></fa-icon>
        </a>
      </div>

      <!-- Tab bar (scaffold for future imports, e.g. a Recovery tab) -->
      <div class="flex flex-row border-b border-secondary">
        <button v-for="tab in tabs" :key="tab.id"
          class="flex-1 px-3 py-2 text-sm font-semibold border-b-2 transition-colors"
          :class="activeTab === tab.id
            ? 'border-blue-400 text-primary'
            : 'border-transparent opacity-60 hover:opacity-100'"
          @click="activeTab = tab.id">
          <fa-icon :icon="['fas', tab.icon]" class="mr-1"></fa-icon>{{ tab.label }}
        </button>
      </div>

      <!-- Search (per tab) -->
      <div class="p-2 border-b border-secondary">
        <input v-model="searches[activeTab]" type="text" :placeholder="'Search ' + activeLabel + '…'"
          class="w-full bg-primary text-primary border border-secondary rounded px-2 py-1 text-sm">
      </div>

      <!-- Treasure tab -->
      <template v-if="activeTab === 'treasure'">
        <p v-if="! items.length" class="p-3 text-sm opacity-70">
          No supplies imported yet — use
          <fa-icon :icon="['fas', 'file-import']"></fa-icon> Import supplies in the menu.
        </p>
        <p v-else-if="! filtered.length" class="p-3 text-sm opacity-70">
          No items match “{{ searches.treasure }}”.
        </p>
        <div v-else class="grid grid-cols-3 gap-2 flex-1 min-h-0 overflow-y-auto p-3">
          <div v-for="item in filtered" :key="item.key"
            class="flex flex-col items-center gap-1"
            :class="item.remaining === 0 ? 'opacity-50' : ''">
            <a :href="'https://gbf.wiki/' + item.name" target="_blank" :title="item.name">
              <img :src="imgUrl(item)" style="height: 40px; width: 40px;"
                class="hover:ring-2 hover:ring-blue-400 rounded">
            </a>
            <span class="text-xs whitespace-nowrap" :class="item.remaining === 0 ? 'text-red-400' : ''">
              {{ item.remaining }} / {{ item.owned }}
            </span>
          </div>
        </div>
      </template>
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
  data() {
    return {
      activeTab: 'treasure',
      // Per-tab search text — each tab keeps its own query.
      searches: {
        treasure: '',
      },
      tabs: [
        { id: 'treasure', label: 'Treasure', icon: 'box-archive' },
      ],
    };
  },
  computed: {
    activeLabel() {
      const tab = this.tabs.find((t) => t.id === this.activeTab);
      return tab ? tab.label : '';
    },
    items() {
      // Re-evaluates when stock/owned change (the method reads reactive state).
      return inventory.inventoryList();
    },
    filtered() {
      const q = this.searches.treasure.trim().toLowerCase();
      if (! q) return this.items;
      return this.items.filter((item) => item.name.toLowerCase().includes(q));
    },
  },
  methods: {
    imgUrl(item) {
      return import.meta.env.BASE_URL + 'img/item/' + item.key + (item.animated ? '.gif' : '.jpg');
    },
  },
};
</script>
