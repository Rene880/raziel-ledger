<template>
  <div class="fixed top-12 right-0 z-40 flex flex-row items-stretch h-[calc(100vh-3rem)]">
    <!-- Panel (expands to the left of the rail) -->
    <div v-if="open"
      class="flex flex-col bg-tertiary text-primary border-l border-r-0 border-secondary rounded-l shadow-lg w-80">
      <div class="flex flex-row justify-between items-center p-3 border-b border-secondary">
        <h2 class="text-lg font-bold">{{ activeLabel }}</h2>
        <a class="cursor-pointer" @click="$emit('update:open', false)" title="Collapse">
          <fa-icon :icon="['fas', 'angle-right']"></fa-icon>
        </a>
      </div>

      <!-- Search (Treasure tab only) -->
      <div v-if="activeTab === 'treasure'" class="p-2 border-b border-secondary">
        <input v-model="searches.treasure" type="text" placeholder="Search Treasure…"
          class="w-full bg-primary text-primary border border-secondary rounded px-2 py-1 text-sm">
      </div>

      <!-- Treasure tab -->
      <template v-if="activeTab === 'treasure'">
        <p v-if="! items.length" class="p-3 text-sm opacity-70">
          No supplies imported yet — open the
          <fa-icon :icon="['fas', 'file-import']"></fa-icon> Import tab.
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

      <!-- Import tab (inline form) -->
      <div v-else-if="activeTab === 'import'" class="flex-1 min-h-0 overflow-y-auto p-3">
        <supplies-import></supplies-import>
      </div>
    </div>

    <!-- Icon rail (always visible, right edge) -->
    <div class="flex flex-col items-center gap-1 bg-tertiary text-primary border-l border-secondary py-2 px-1"
      :class="open ? 'rounded-r-none' : 'rounded-l'">
      <button v-for="tab in tabs" :key="tab.id"
        class="px-2 py-3 rounded transition-colors hover:bg-secondary"
        :class="open && activeTab === tab.id ? 'bg-secondary' : ''"
        :title="tab.label"
        @click="selectTab(tab.id)">
        <fa-icon :icon="['fas', tab.icon]" class="text-lg"></fa-icon>
      </button>
    </div>
  </div>
</template>

<script>
import inventory from '@/js/inventory'
import SuppliesImport from '@/components/SuppliesImport.vue'

export default {
  components: {
    SuppliesImport,
  },
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
      // Per-tab search text — Treasure keeps its own query.
      searches: {
        treasure: '',
      },
      tabs: [
        { id: 'treasure', label: 'Treasure', icon: 'warehouse' },
        { id: 'import', label: 'Import supplies', icon: 'file-import' },
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
    // Rail click: open the panel on this tab; clicking the active tab collapses it.
    selectTab(id) {
      if (this.open && this.activeTab === id) {
        this.$emit('update:open', false);
        return;
      }
      this.activeTab = id;
      if (! this.open) this.$emit('update:open', true);
    },
    imgUrl(item) {
      return import.meta.env.BASE_URL + 'img/item/' + item.key + (item.animated ? '.gif' : '.jpg');
    },
  },
};
</script>
