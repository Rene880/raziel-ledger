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
        <p class="opacity-80">You can now track what you actually own against what a unit needs:</p>
        <ul class="list-disc list-inside flex flex-col gap-1">
          <li>Import your in-game <strong>supplies JSON</strong> to record what you own.</li>
          <li>
            <fa-icon :icon="['fas', 'star']" class="text-yellow-400"></fa-icon>
            <strong>Focus</strong> a unit to auto-fill its materials from your stock.
          </li>
          <li>The <strong>Supplies</strong> side panel shows <code>remaining / owned</code> per item.</li>
        </ul>

        <router-link :to="{ name: 'import-guide' }" target="_blank"
          class="underline self-start hover:text-link-hover">
          <fa-icon :icon="['fa', 'external-link-alt']"></fa-icon>
          How to get your supplies JSON &rarr;
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
