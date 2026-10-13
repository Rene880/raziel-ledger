<template>
  <!-- "What's new" changelog modal — tl;dr of the latest release, links the import guide. -->
  <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <!-- Backdrop — clicking outside the card closes the modal -->
    <div class="absolute inset-0 bg-black/60" @click="$emit('update:open', false)"></div>

    <!-- Card -->
    <div class="relative w-full max-w-md bg-tertiary text-primary border border-secondary rounded shadow-lg">
      <div class="flex flex-row justify-between items-center p-4 border-b border-secondary">
        <h2 class="text-lg font-bold flex items-center gap-2">
          <fa-icon :icon="['fas', 'bullhorn']" class="text-yellow-400"></fa-icon>
          What's new
        </h2>
        <a class="cursor-pointer" @click="$emit('update:open', false)" title="Close">
          <fa-icon :icon="['fas', 'xmark']"></fa-icon>
        </a>
      </div>

      <div class="p-4 flex flex-col gap-3 text-sm">
        <p class="opacity-80"><strong>Evoker Transcendence</strong> is now in the Evokers calculator:</p>
        <ul class="list-disc list-inside flex flex-col gap-1">
          <li>New steps <strong>Transcendence Stage 1</strong> and <strong>Stage 2</strong>, after "Unlock 4th skill".</li>
          <li>Covers the new materials: Belief, Wheels, Fellcores, Odious &amp; Revans unique items, and Tomes of Secrets.</li>
          <li>Stages 3&ndash;5 will be added once they're released.</li>
        </ul>

        <router-link :to="{ name: 'import-guide' }" target="_blank"
          class="underline self-start hover:text-link-hover">
          <fa-icon :icon="['fa', 'external-link-alt']"></fa-icon>
          New here? How to import your supplies &rarr;
        </router-link>
      </div>

      <div class="flex flex-row justify-end p-4 border-t border-secondary">
        <button class="btn btn-blue" @click="$emit('update:open', false)">Got it</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:open'],
};
</script>
