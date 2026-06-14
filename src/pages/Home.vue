<template>
  <div class="flex flex-col items-center">
    <h1 class="self-center mb-4">Raziel Ledger</h1>
    <p class="mb-8 text-center">
      Material calculators for Granblue Fantasy long-term goals.<br>
      Pick a calculator to get started. Your progress is saved in your browser.
    </p>

    <div class="flex flex-row flex-wrap justify-center gap-8">
      <router-link
        to="/calceternal"
        class="flex flex-col items-center border-4 border-secondary rounded bg-tertiary p-8 w-72 hover:border-primary"
      >
        <img :src="baseUrl + 'img/item/goldbrick.jpg'" alt="Eternals" class="mb-4 w-16 h-16">
        <h2 class="mb-4">Eternals</h2>
        <p class="text-primary text-center">
          Recruit, uncap, radiance, and transcend the Eternals using the "40 boxes" method.
        </p>
      </router-link>

      <router-link
        to="/calcevoker"
        class="flex flex-col items-center border-4 border-secondary rounded bg-tertiary p-8 w-72 hover:border-primary"
      >
        <img :src="baseUrl + 'img/item/newworldquartz.jpg'" alt="Evokers" class="mb-4 w-16 h-16">
        <h2 class="mb-4">Evokers</h2>
        <p class="text-primary text-center">
          Obtain Arcarum summons, recruit the Evokers, and uncap their weapons.
        </p>
      </router-link>
    </div>
  </div>
</template>

<script>
import setHead from '@/js/head'

export default {
  data() {
    return {
      baseUrl: import.meta.env.BASE_URL,
    };
  },
  mounted() {
    setHead({
      title: 'Raziel Ledger - Granblue Fantasy Calculators',
      desc: 'Material calculators for Granblue Fantasy Eternals and Evokers',
    });
  }
}
</script>
