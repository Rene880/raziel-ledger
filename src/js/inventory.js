// Shared supplies inventory + "focus" coordination (PRD §15, v1.2.11).
//
// - The player imports their in-game supplies stock (the supplies-response.json
//   shape: an array of { item_id, number, ... }). `item_id` is matched against
//   the `itemId` on each `supplies.js` item to build a flat { suppliesKey: count }
//   stock map. Weapon-namespace items (weapon ids), rupie/crystal and the
//   evolution items have no matching item-path id and are skipped.
// - "Focus" is a single, app-global star on a calculator unit. Focusing a unit
//   spends the stock against that unit's required materials (filling its progress
//   up to what's needed, earliest step first) and snapshots both the consumed
//   amounts and the overwritten progress values. Only ONE unit can be focused at
//   a time: switching focus first resets the previous unit (restores its progress
//   and returns the spent stock) before applying to the new one.
//
// No Vuex (PRD §6): this is a small `reactive` module store, persisted under the
// `App-inventory` localStorage key alongside the other `App-*` keys.

import { reactive } from 'vue'
import supplies from '@/js/supplies'

const LS_KEY = 'App-inventory'

// itemId (string) -> supplies key. Built once from the frozen item table.
const itemIdToKey = {}
for (const [key, item] of Object.entries(supplies.items)) {
  if (item.itemId != null) {
    itemIdToKey[String(item.itemId)] = key
  }
}

// Persisted state. `active` is the one focused unit (or null); `pending` holds
// progress-restore snapshots for calculators that owned a focus but are not
// currently mounted (applied when they next register).
const state = reactive({
  stock: {},          // { suppliesKey: count } — remaining after focus spend
  owned: {},          // { suppliesKey: count } — imported baseline, not spent by focus
  order: {},          // { suppliesKey: seqIndex } — import-array position (game seq order)
  active: null,       // { calcId, unitKey, name, consumed: {key:amt}, prior: [{unitKey,step,key,value}] }
  pending: {},        // { calcId: [{unitKey,step,key,value}] }
  warningDismissed: false, // focus/unfocus warning "don't show again"
})

// Live calculator contexts, keyed by calcId: { unitsData, progress }. Not
// reactive — only used to reach the live progress object for mutation/revert.
const registry = {}

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify({
    stock: state.stock,
    owned: state.owned,
    order: state.order,
    active: state.active,
    pending: state.pending,
    warningDismissed: state.warningDismissed,
  }))
}

function load() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    state.stock = parsed.stock || {}
    // Older inventories have no `owned` baseline — fall back to the
    // remaining stock so the sidebar still has a denominator.
    state.owned = parsed.owned || { ...state.stock }
    // Pre-amendment inventories have no import-order map — fall back to the
    // category→name sort in inventoryList() when it's empty.
    state.order = parsed.order || {}
    state.active = parsed.active || null
    state.pending = parsed.pending || {}
    state.warningDismissed = !!parsed.warningDismissed
  } catch {
    // Ignore corrupt data — start from an empty inventory.
  }
}
load()

// Resolve one material entry (a concrete item or an element/summon group) to the
// concrete item keys and the quantity needed per key. Mirrors Calculator.vue's
// getItemProgressFor so focus fills exactly what the calculator displays.
function resolveItem(unitsData, unitKey, item) {
  let itemRefs = []
  if (item.item) {
    itemRefs.push(item.item)
  } else if (item.group) {
    const group = supplies.groups[item.group]
    let ref
    if (group.type === 'element') {
      ref = group[unitsData.units[unitKey].element]
    } else if (group.type === 'summon') {
      ref = group[unitKey]
    }
    itemRefs = Array.isArray(ref) ? ref : [ref]
  } else {
    return []
  }

  let needed = item.q / itemRefs.length
  if (item.q % itemRefs.length > 0) {
    needed = needed < 5 ? Math.ceil(needed) : Math.floor(needed)
  }
  return itemRefs.map((ref) => ({ key: ref, needed }))
}

// Per-step merged { key: needed } for a unit's selected from→to range.
function resolveUnitSteps(unitsData, unitKey, from, to) {
  const result = []
  unitsData.materials.slice(from + 1, to + 1).forEach((stepData, index) => {
    const step = index + from + 1
    const items = {}
    stepData.items
      .flatMap((item) => resolveItem(unitsData, unitKey, item))
      .forEach(({ key, needed }) => {
        items[key] = (items[key] || 0) + needed
      })
    result.push({ step, items })
  })
  return result
}

// Spend stock against a unit, filling its progress; returns the snapshot.
function applyFocus(ctx, unitKey) {
  const unit = ctx.progress[unitKey]
  const steps = resolveUnitSteps(ctx.unitsData, unitKey, unit.from, unit.to)
  const consumed = {}
  const prior = []

  for (const { step, items } of steps) {
    while (unit.materials.length <= step) unit.materials.push({})
    const bucket = unit.materials[step]
    for (const [key, needed] of Object.entries(items)) {
      const have = state.stock[key] || 0
      if (have <= 0 && !(key in bucket)) {
        // Nothing to spend and no prior value to snapshot — skip.
        continue
      }
      const take = Math.min(have, needed)
      prior.push({ unitKey, step, key, value: bucket[key] || 0 })
      bucket[key] = take
      state.stock[key] = have - take
      consumed[key] = (consumed[key] || 0) + take
    }
  }
  return { consumed, prior }
}

// Restore progress values overwritten by a focus.
function revertPrior(progress, prior) {
  for (const { unitKey, step, key, value } of prior) {
    if (progress[unitKey] && progress[unitKey].materials[step]) {
      progress[unitKey].materials[step][key] = value
    }
  }
}

// Clear the active focus: restore its progress (live if mounted, else deferred)
// and return the spent stock.
function clearActiveFocus() {
  if (!state.active) return
  const { calcId, consumed, prior } = state.active
  const ctx = registry[calcId]
  if (ctx) {
    revertPrior(ctx.progress, prior)
  } else {
    state.pending[calcId] = (state.pending[calcId] || []).concat(prior)
  }
  for (const [key, amount] of Object.entries(consumed)) {
    state.stock[key] = (state.stock[key] || 0) + amount
  }
  state.active = null
}

export default {
  state,

  // A calculator instance (or page) makes its live progress mutable by the store.
  register(calcId, unitsData, progress) {
    registry[calcId] = { unitsData, progress }
    if (state.pending[calcId]) {
      revertPrior(progress, state.pending[calcId])
      delete state.pending[calcId]
      persist()
    }
  },

  unregister(calcId) {
    delete registry[calcId]
  },

  isFocused(calcId, unitKey) {
    return !!state.active && state.active.calcId === calcId && state.active.unitKey === unitKey
  },

  hasStock() {
    return Object.keys(state.stock).length > 0
  },

  // Toggle the global focus onto (calcId, unitKey), or off if it is already focused.
  toggleFocus(calcId, unitKey) {
    const ctx = registry[calcId]
    if (!ctx) return
    const wasSame = this.isFocused(calcId, unitKey)
    clearActiveFocus()
    if (!wasSame) {
      const { consumed, prior } = applyFocus(ctx, unitKey)
      const unit = ctx.unitsData.units[unitKey]
      state.active = { calcId, unitKey, name: unit ? unit.name : String(unitKey), consumed, prior }
    }
    persist()
  },

  // Persist the focus/unfocus warning "don't show again" choice.
  dismissWarning() {
    state.warningDismissed = true
    persist()
  },

  // Sorted rows for the inventory sidebar: every owned item with its remaining
  // stock. Sorted left-to-right by import-array position (the game's seq order);
  // pre-amendment inventories with no `order` map fall back to category then name,
  // mirroring Calculator's sortMaterials.
  inventoryList() {
    const hasOrder = Object.keys(state.order).length > 0
    return Object.keys(state.owned)
      .filter((key) => (state.owned[key] || 0) > 0)
      .map((key) => {
        const item = supplies.items[key] || {}
        return {
          key,
          name: item.name || key,
          animated: !!item.animated,
          category: item.category || 0,
          order: state.order[key] != null ? state.order[key] : Infinity,
          owned: state.owned[key] || 0,
          remaining: state.stock[key] || 0,
        }
      })
      .sort((a, b) => {
        if (hasOrder && a.order !== b.order) return a.order - b.order
        if (a.category !== b.category) return a.category - b.category
        return a.name.localeCompare(b.name)
      })
  },

  // Replace the whole stock from a parsed supplies-response.json array.
  // Returns { total, matched, unmatched }.
  importFromResponse(arr) {
    if (!Array.isArray(arr)) {
      throw new Error('Expected a JSON array of supply entries.')
    }
    const map = {}
    const order = {}
    let matched = 0
    for (let i = 0; i < arr.length; i++) {
      const entry = arr[i]
      const key = itemIdToKey[String(entry?.item_id)]
      if (key) {
        map[key] = Number(entry.number) || 0
        order[key] = i  // import-array position == game seq order
        matched++
      }
    }
    clearActiveFocus()
    state.stock = map
    state.owned = { ...map }
    state.order = order
    persist()
    return { total: arr.length, matched, unmatched: arr.length - matched }
  },
}
