<template>
  <div class="flex flex-col items-center">
    <h1 class="self-center mb-8">Eternal Materials Calculator</h1>

    <span class="mb-8">
      This calculator uses the "40 boxes" method.<br>
      You can also spend a Gold Bar instead of reducing 10 Revenant Weapons, even if it's not recommanded in the long run.<br>
      For more information on the whole process, please check the Wiki:<br>
      <ul class="list-disc ml-4">
          <li><a target="_blank" href="https://gbf.wiki/Revenant_Weapons">To recruit an Eternal
            <fa-icon :icon="['fas', 'external-link-alt']" class="text-sm"></fa-icon></a>
          </li>
          <li><a target="_blank" href="https://gbf.wiki/Uncapping_Eternals">To uncap an Eternal to 5*
            <fa-icon :icon="['fas', 'external-link-alt']" class="text-sm"></fa-icon></a>
          </li>
          <li><a target="_blank" href="https://gbf.wiki/Eternals_Transcendence">For the Eternal Transcendance
            <fa-icon :icon="['fas', 'external-link-alt']" class="text-sm"></fa-icon></a>
          </li>
      </ul>
    </span>

    <!-- Tabs -->
    <div class="flex flex-row gap-2 mb-8">
      <button class="btn" :class="activeTab === 0 ? 'btn-blue' : 'btn-white'" @click="activeTab = 0">
        Recruit &amp; Transcend
      </button>
      <button class="btn" :class="activeTab === 1 ? 'btn-blue' : 'btn-white'" @click="activeTab = 1">
        Radiance
      </button>
    </div>

    <calculator
      v-show="activeTab === 0"
      :unitsProgress="progress"
      :unitsData="getEternalData"
      unitsLabel="an Eternal"
      v-model:unitsSplitMats="splitMats"
      v-model:unitsHideCompletedMats="hideCompletedMats"
      v-model:unitsDisplayList="displayList"
    ></calculator>

    <calculator
      v-show="activeTab === 1"
      :unitsProgress="radianceProgress"
      :unitsData="getRadianceData"
      unitsLabel="an Eternal"
      v-model:unitsSplitMats="splitMats"
      v-model:unitsHideCompletedMats="hideCompletedMats"
      v-model:unitsDisplayList="displayList"
    ></calculator>
  </div>
</template>

<script>
import utils from '@/js/utils'
import supplies from '@/js/supplies-eternals'
import setHead from '@/js/head'

import Calculator from '@/components/Calculator.vue'

const lsMgt = new utils.LocalStorageMgt('CalcEternal');

export default {
  components: {
    Calculator,
  },
  data() {
    return {
      // { 2040236: new UnitProgress([{chaotichaze: 0, ...}, ...]), ... }
      progress: {},
      // Same shape as progress, tracked separately for the Radiance tab
      radianceProgress: {},
      activeTab: 0,
      splitMats: true,
      hideCompletedMats: false,
      displayList: 0,
    };
  },
  computed: {
    getEternalData() {
      return supplies.ETERNALS_DATA;
    },
    getRadianceData() {
      return {
        units: supplies.ETERNALS_DATA.units,
        materials: supplies.ETERNALS_DATA.radiance,
      };
    }
  },
  watch: {
    progress: {
      handler() {
        lsMgt.setValue('progress', this);
      },
      deep: true
    },
    radianceProgress: {
      handler() {
        lsMgt.setValue('radianceProgress', this);
      },
      deep: true
    },
    activeTab() {
      lsMgt.setValue('activeTab', this);
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
    setHead({
      title: 'Raziel Ledger - Eternal Calculator',
      desc: 'Get the complete list of materials needed to unlock a specific Eternal',
    });

    lsMgt.getValue(this, 'progress');
    lsMgt.getValue(this, 'radianceProgress');
    lsMgt.getValue(this, 'activeTab');
    lsMgt.getValue(this, 'splitMats');
    lsMgt.getValue(this, 'hideCompletedMats');
    lsMgt.getValue(this, 'displayList');
  }
};
</script>
