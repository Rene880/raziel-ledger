<template>
  <div id="app" class="flex flex-col text-primary bg-primary min-h-screen" :class="getTheme">
    <!-- Menu -->
    <nav class="bg-tertiary shadow-md flex flex-row justify-between items-center">
      <!-- left -->
      <div class="flex flex-row">
        <router-link to="/" class="flex items-center hover:bg-tertiary px-2">
          <fa-icon title="Home" :icon="['fas', 'book']" class="text-primary text-2xl"></fa-icon>
        </router-link>
        <router-link class="flex items-center gbf-menu-link h-12" to="/calceternal">Eternals Calc.</router-link>
        <router-link class="flex items-center gbf-menu-link h-12" to="/calcevoker">Evokers Calc.</router-link>

        <!-- Currently focused unit (global, single) — kept rightmost of the left group -->
        <a v-if="activeFocus" class="flex items-center gap-1 gbf-menu-link h-12 cursor-pointer max-w-[10rem] sm:max-w-xs"
          :title="'Focused: ' + activeFocus.name + ' — go to calculator'"
          @click="goToFocus">
          <fa-icon :icon="['fas', 'star']" class="text-yellow-400 shrink-0"></fa-icon>
          <span class="truncate">{{ activeFocus.name }}</span>
        </a>
      </div>

      <!-- right -->
      <div class="flex flex-row items-center gap-x-4 px-4">
        <div class="cursor-pointer select-none hover:text-link-hover" title="Import supplies" @click="showImport = true">
          <fa-icon :icon="['fas', 'file-import']"></fa-icon>
        </div>
        <span class="select-none hidden sm:block text-xs opacity-70" title="App version">v{{ appVersion }}</span>
        <span class="select-none hidden sm:block">{{ getJST }} JST</span>
        <div class="cursor-pointer select-none hover:text-link-hover" title="Dark mode" @click="theme_dark = true"><fa-icon :icon="['fas', 'moon']"></fa-icon></div>
        <div class="cursor-pointer select-none hover:text-link-hover" title="Blue" @click="theme_dark = 'blue'"><fa-icon :icon="['fas', 'water']"></fa-icon></div>
        <div class="cursor-pointer select-none hover:text-link-hover" title="Light mode" @click="theme_dark = false"><fa-icon :icon="['fas', 'sun']"></fa-icon></div>
      </div>
    </nav>

    <!-- Main page -->
    <main class="p-4 grow relative">
      <router-view></router-view>
    </main>

    <!-- Supplies import dialog -->
    <supplies-import v-if="showImport" @close="showImport = false"></supplies-import>

    <!-- Inventory sidebar (global) -->
    <inventory-sidebar v-model:open="sidebarOpen"></inventory-sidebar>

    <!-- Footer -->
    <footer class="flex flex-col items-center bg-tertiary shadow-md w-full py-4 text-xs text-center">
      <p class="flex flex-wrap place-content-center">
        <a href="https://github.com/Minimalist3/GranblueParty" target="_blank" class="pr-4">
          <fa-icon :icon="['fab', 'github']" class="text-primary text-lg"></fa-icon> Based on Minimalist3/GranblueParty (GPL-3.0)
        </a>
        <a href="https://gbf.wiki" target="_blank" class="pr-4">
          <fa-icon :icon="['fa', 'external-link-alt']" class="text-primary text-lg"></fa-icon> gbf.wiki
        </a>
      </p>
      <p>
        Granblue Fantasy content and materials are trademarks and copyrights of Cygames, Inc. or its licensors. All rights reserved.
      </p>
    </footer>
  </div>
</template>

<script>
import Utils from '@/js/utils.js'
import pkg from '../package.json'
import inventory from '@/js/inventory'
import SuppliesImport from '@/components/SuppliesImport.vue'
import InventorySidebar from '@/components/InventorySidebar.vue'

const lsMgt = new Utils.LocalStorageMgt('App');

// calcId → calculator route (and Eternal tab) for the focus chip.
const FOCUS_ROUTES = {
  CalcEternal: { path: '/calceternal', query: { tab: 'recruit' } },
  CalcEternalRadiance: { path: '/calceternal', query: { tab: 'radiance' } },
  CalcEvoker: { path: '/calcevoker' },
};

const getJST_options = {
  timeZone: 'Asia/Tokyo',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
}

export default {
  components: {
    SuppliesImport,
    InventorySidebar,
  },
  data() {
    return {
      now: new Date(),
      theme_dark: true,
      appVersion: pkg.version,
      showImport: false,
      sidebarOpen: false,
    }
  },
  computed: {
    activeFocus() {
      return inventory.state.active;
    },
    getTheme() {
      if (this.theme_dark === true) {
        return 'theme-dark';
      }
      if (this.theme_dark === false) {
        return 'theme-light';
      }
      return 'theme-blue';
    },
    getJST() {
      return new Intl.DateTimeFormat("default", getJST_options).format(this.now);
    },
  },
  watch: {
    theme_dark() {
      lsMgt.setValue('theme_dark', this);
    },
    sidebarOpen() {
      lsMgt.setValue('sidebarOpen', this);
    },
  },
  methods: {
    goToFocus() {
      const focus = inventory.state.active;
      if (! focus) return;
      const target = FOCUS_ROUTES[focus.calcId];
      if (target) this.$router.push(target);
    },
  },
  mounted() {
    setInterval(() => this.now = new Date(), 1000 * 60);
    lsMgt.getValue(this, 'theme_dark');
    lsMgt.getValue(this, 'sidebarOpen');
  }
}
</script>

<style scoped>
.gbf-menu-link {
  @apply p-2;
  @apply text-primary;
  @apply whitespace-nowrap;
}

.gbf-menu-link:hover {
  @apply bg-secondary;
  @apply text-primary;
}
</style>
