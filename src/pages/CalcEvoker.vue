<template>
  <div class="flex flex-col items-center">
    <h1 class="self-center mb-8">Arcarum Summon and Evoker Materials Calculator</h1>

    <span class="mb-8">
      For more information on the whole process, please check the Wiki:<br>
      <ul class="list-disc ml-4">
          <li><a target="_blank" href="https://gbf.wiki/Arcarum_Summons">To obtain a Summon
            <fa-icon :icon="['fas', 'external-link-alt']" class="text-sm"></fa-icon></a>
          </li>
          <li><a target="_blank" href="https://gbf.wiki/Arcarum_Evokers">To recruit an Evoker
            <fa-icon :icon="['fas', 'external-link-alt']" class="text-sm"></fa-icon></a>
          </li>
          <li><a target="_blank" href="https://gbf.wiki/New_World_Foundation_Weapons">To obtain New World Foundation Weapons
            <fa-icon :icon="['fas', 'external-link-alt']" class="text-sm"></fa-icon></a>
          </li>
      </ul>
    </span>

    <calculator
      :unitsProgress="progress"
      :unitsData="getEvokerData"
      unitsLabel="an Evoker"
      calcId="CalcEvoker"
      v-model:unitsSplitMats="splitMats"
      v-model:unitsHideCompletedMats="hideCompletedMats"
      v-model:unitsDisplayList="displayList"
    ></calculator>
  </div>
</template>

<script>
import utils from '@/js/utils'
import supplies from '@/js/supplies-evokers'
import inventory from '@/js/inventory'

import Calculator from '@/components/Calculator.vue'

const lsMgt = new utils.LocalStorageMgt('CalcEvoker');

export default {
  components: {
    Calculator,
  },
  data() {
    return {
      // { 2040236: new EvokerProgress([{chaotichaze: 0, ...}, ...]), ... }
      progress: {},
      splitMats: true,
      hideCompletedMats: false,
      displayList: 0,
    };
  },
  computed: {
    getEvokerData() {
      return supplies.EVOKERS_DATA;
    }
  },
  watch: {
    progress: {
      handler() {
        lsMgt.setValue('progress', this);
      },
      deep: true
    },
    splitMats() {
      lsMgt.setValue('splitMats', this);
    },
    hideCompletedMats() {
      lsMgt.setValue('hideCompletedMats', this);
    },
    displayList() {
      lsMgt.setValue('displayList', this);
    }
  },
  mounted() {
    // Per-route <title>/meta is set centrally by the router afterEach hook (src/router/index.js).
    lsMgt.getValue(this, 'progress');
    lsMgt.getValue(this, 'splitMats');
    lsMgt.getValue(this, 'hideCompletedMats');
    lsMgt.getValue(this, 'displayList');

    inventory.register('CalcEvoker', this.getEvokerData, this.progress);
  },
  beforeUnmount() {
    inventory.unregister('CalcEvoker');
  }
};
</script>
