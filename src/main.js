// Raziel Ledger - a Vue 3 + Vite rewrite of the calculators from
// GranblueParty (https://github.com/Minimalist3/GranblueParty), GPL-3.0

import { createApp } from 'vue'

import { library as faCore, config as faConfig } from '@fortawesome/fontawesome-svg-core'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import {
  faAngleDown, faAngleRight, faBook, faCheck, faExternalLinkAlt, faMoon, faSun, faTrash,
  faToggleOn, faToggleOff, faWater
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import '@fortawesome/fontawesome-svg-core/styles.css'

import App from './App.vue'
import router from './router'
import './css/app.css'

faConfig.autoAddCss = false;
faCore.add(
  faGithub, faAngleDown, faAngleRight, faBook, faCheck, faExternalLinkAlt, faMoon, faSun, faTrash,
  faToggleOn, faToggleOff, faWater
);

const app = createApp(App);
app.component('fa-icon', FontAwesomeIcon);
app.use(router);
app.mount('#app');
