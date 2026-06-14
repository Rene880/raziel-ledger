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
      </div>

      <!-- right -->
      <div class="flex flex-row items-center gap-x-4 px-4">
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

const lsMgt = new Utils.LocalStorageMgt('App');

const getJST_options = {
  timeZone: 'Asia/Tokyo',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
}

export default {
  data() {
    return {
      now: new Date(),
      theme_dark: true,
    }
  },
  computed: {
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
  },
  mounted() {
    setInterval(() => this.now = new Date(), 1000 * 60);
    lsMgt.getValue(this, 'theme_dark');
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
