<template>
  <div class="flex flex-col items-center">
    <div class="w-full max-w-2xl">
      <h1 class="mb-2">How to import your supplies</h1>
      <p class="mb-6 opacity-80">
        Granblue's web client exposes your full item inventory as a JSON response. Copy it from your
        browser's developer tools and paste it into the
        <fa-icon :icon="['fas', 'file-import']"></fa-icon> Import supplies panel — matched items become
        your stock, ready to spend on a unit with the
        <fa-icon :icon="['fas', 'star']" class="text-yellow-400"></fa-icon> focus button.
      </p>

      <!-- Desktop-only note -->
      <p class="mb-8 flex items-start gap-2 rounded border border-secondary bg-tertiary p-3 text-sm">
        <fa-icon :icon="['fas', 'triangle-exclamation']" class="mt-0.5 text-yellow-400 shrink-0"></fa-icon>
        <span><strong>Desktop only.</strong> This relies on the browser's developer tools and the
          <code>game.granbluefantasy.jp</code> web version, so it can't be done on the mobile app.</span>
      </p>

      <ol class="flex flex-col gap-8">
        <li v-for="step in steps" :key="step.n" class="flex flex-col gap-3">
          <h2 class="text-lg font-bold">
            <span class="text-link-primary mr-1">{{ step.n }}.</span>
            <span v-html="step.html"></span>
          </h2>
          <div v-if="step.images.length" class="flex flex-col gap-3">
            <img v-for="img in step.images" :key="img.src"
              :src="baseUrl + 'img/docs/' + img.src" :alt="img.alt"
              class="rounded border border-secondary max-w-full">
          </div>
        </li>
      </ol>

      <p class="mt-10">
        <router-link to="/">&larr; Back home</router-link>
      </p>
    </div>
  </div>
</template>

<script>
// Per-route <title>/meta is set centrally by the router afterEach hook (src/router/index.js).
// Screenshots live in public/img/docs/ (hand-supplied, not game assets — outside check-item-images.js).
export default {
  data() {
    return {
      baseUrl: import.meta.env.BASE_URL,
      steps: [
        {
          n: 1,
          html: 'With Granblue Fantasy open in a browser, open the developer tools (right-click anywhere &rarr; <strong>Inspect</strong>) and switch to the <strong>Network</strong> tab.',
          images: [
            { src: 'step1-inspect.png', alt: 'Right-click context menu with the Inspect option' },
            { src: 'step2-network-tab.png', alt: 'DevTools Network tab toolbar' },
          ],
        },
        {
          n: 2,
          html: 'In the game, go to (or refresh) the <strong>Supplies</strong> page so the request is made.',
          images: [],
        },
        {
          n: 3,
          html: 'In the Network request list, right-click the entry whose name starts with <code>article_list_by_filter_mode</code>.',
          images: [
            { src: 'step3-article-row.png', alt: 'The article_list_by_filter_mode request in the Network list' },
          ],
        },
        {
          n: 4,
          html: 'Choose <strong>Copy &rarr; Copy response</strong>.',
          images: [
            { src: 'step4-copy-response.png', alt: 'Copy submenu with Copy response highlighted' },
          ],
        },
        {
          n: 5,
          html: 'Open the <strong>Import supplies</strong> panel, paste the copied text into the box, and click <strong>Import</strong>.',
          images: [
            { src: 'step5-paste.png', alt: 'The Import supplies panel with JSON pasted in' },
          ],
        },
      ],
    };
  },
}
</script>
