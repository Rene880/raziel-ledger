<template>
  <!-- Inline import form (rendered inside the supplies side nav's Import tab) -->
  <div class="flex flex-col gap-3 text-primary">
    <p class="text-sm opacity-80">
      Paste your supplies JSON (the <code>game.granbluefantasy.jp</code> item list response),
      or load it from a <code>.json</code> file. Matched items become your stock and can be spent
      on a unit with the <fa-icon :icon="['fas', 'star']" class="text-yellow-400"></fa-icon> focus button.
    </p>

    <label class="btn btn-white self-start cursor-pointer">
      Choose JSON file…
      <input type="file" accept=".json,application/json" class="hidden" @change="onFile">
    </label>

    <textarea
      v-model="text"
      rows="6"
      spellcheck="false"
      placeholder='[ { "item_id": "2", "number": "17691", ... }, ... ]'
      class="w-full bg-primary text-primary border border-secondary rounded p-2 font-mono text-xs"
    ></textarea>

    <p v-if="result" class="text-sm" :class="result.error ? 'text-red-400' : 'text-green-400'">
      <template v-if="result.error">{{ result.error }}</template>
      <template v-else>
        Imported {{ result.matched }} item{{ result.matched === 1 ? '' : 's' }}
        ({{ result.unmatched }} of {{ result.total }} entries skipped — weapons / currency / unknown ids).
      </template>
    </p>

    <div class="flex flex-row justify-end">
      <button class="btn btn-blue" @click="doImport" :disabled="! text.trim()">Import</button>
    </div>
  </div>
</template>

<script>
import inventory from '@/js/inventory'

export default {
  data() {
    return {
      text: '',
      result: null,
    };
  },
  methods: {
    onFile(event) {
      const file = event.target.files && event.target.files[0];
      if (! file) return;
      const reader = new FileReader();
      reader.onload = () => { this.text = String(reader.result); };
      reader.readAsText(file);
    },
    doImport() {
      let parsed;
      try {
        parsed = JSON.parse(this.text);
      } catch {
        this.result = { error: 'Could not parse JSON — check the pasted text.' };
        return;
      }
      try {
        this.result = inventory.importFromResponse(parsed);
      } catch (e) {
        this.result = { error: e.message || 'Import failed.' };
      }
    },
  },
};
</script>
