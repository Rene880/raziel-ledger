<template>
  <div class="flex flex-col items-center">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" class="self-center mb-4 w-full max-w-lg text-primary" aria-label="Raziel Ledger" role="img">
      <text x="50%" y="50%"
        style="font-family: 'Great Vibes', 'Brush Script MT', 'Lucida Handwriting', cursive; font-size: 130px; fill: currentColor; text-anchor: middle; dominant-baseline: central;"
      >Raziel Ledger</text>
    </svg>
    <p class="mb-8 text-center">
      Eternals and Evokers material trackers/calculators for Granblue Fantasy (GBF) <br>
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
// Per-route <title>/meta is set centrally by the router afterEach hook (src/router/index.js).
export default {
  data() {
    return {
      baseUrl: import.meta.env.BASE_URL,
    };
  }
}
</script>
