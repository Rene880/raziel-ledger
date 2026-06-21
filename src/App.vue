<template>
  <div id="app" class="flex flex-col text-primary bg-primary min-h-screen" :class="getTheme">
    <!-- Menu -->
    <nav class="bg-tertiary shadow-md flex flex-row justify-between items-center sticky top-0 z-50">
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
        <span class="select-none hidden sm:block text-xs opacity-70" title="App version">v{{ appVersion }}</span>
        <div class="cursor-pointer select-none hover:text-link-hover" title="What's new" @click="whatsNewOpen = true"><fa-icon :icon="['fas', 'bullhorn']"></fa-icon></div>
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

    <!-- Inventory sidebar (global) -->
    <inventory-sidebar v-model:open="sidebarOpen"></inventory-sidebar>

    <!-- "What's new" changelog popup (auto-shows once per version; reopen from navbar) -->
    <whats-new v-model:open="whatsNewOpen"></whats-new>

    <!-- Footer -->
    <footer class="flex flex-col items-center bg-tertiary border-t border-secondary w-full py-4 text-xs text-center">
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
import InventorySidebar from '@/components/InventorySidebar.vue'
import WhatsNew from '@/components/WhatsNew.vue'

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
    InventorySidebar,
    WhatsNew,
  },
  data() {
    return {
      now: new Date(),
      theme_dark: true,
      appVersion: pkg.version,
      sidebarOpen: false,
      whatsNewOpen: false,
      // Last app version for which the user dismissed the "What's new" popup.
      whatsNewSeenVersion: '',
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
      if (! target) return;
      const anchorId = `focus-anchor-${focus.calcId}-${focus.unitKey}`;
      // Navigate (may be a no-op if already there), then scroll to the unit box.
      this.$router.push(target).catch(() => {}).finally(() => this.scrollToAnchor(anchorId));
    },
    // Poll briefly for the unit box: the target page may still be mounting and,
    // on the Eternal page, the ?tab= switch has to make it visible first
    // (offsetParent is null while the inactive tab is `v-show`-hidden).
    scrollToAnchor(id, attempts = 20) {
      this.$nextTick(() => {
        const el = document.getElementById(id);
        if (el && el.offsetParent !== null) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts > 0) {
          setTimeout(() => this.scrollToAnchor(id, attempts - 1), 50);
        }
      });
    },
  },
  mounted() {
    setInterval(() => this.now = new Date(), 1000 * 60);
    lsMgt.getValue(this, 'theme_dark');
    lsMgt.getValue(this, 'sidebarOpen');
    lsMgt.getValue(this, 'whatsNewSeenVersion');
    // Auto-show the "What's new" popup once per app version. Mark it seen the
    // moment it auto-shows (not on close), so it appears exactly once even if the
    // user reloads or navigates away before pressing "Got it".
    if (this.whatsNewSeenVersion !== this.appVersion) {
      this.whatsNewOpen = true;
      this.whatsNewSeenVersion = this.appVersion;
      lsMgt.setValue('whatsNewSeenVersion', this);
    }
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
