# add-supplies

You are helping the user add game data to the Raziel Ledger project. There are two types of additions: **items** (to `src/js/supplies.js`) and **steps** (to `src/js/supplies-eternals.js` or `src/js/supplies-evokers.js`).

## Step 1 — Identify what to add

Ask the user (or infer from their message) which of these they want:

- **A** — Add one or more items to `src/js/supplies.js`
- **B** — Add one or more steps to `src/js/supplies-eternals.js`
- **C** — Add one or more steps to `src/js/supplies-evokers.js`
- **D** — Multiple of the above

They may also paste raw data (item names, wiki text, etc.) for you to interpret.

---

## Adding Items (option A) — `src/js/supplies.js`

### Item format

```js
keyname: new Item('Display Name', Categories.category),
// or animated variant:
keyname: new Item('Display Name', Categories.category, true),
```

**Categories available:** `quest`, `coop`, `anima`, `arcarum`

**Naming rules for key:**
- All lowercase, no spaces or punctuation (strip apostrophes, hyphens, spaces)
- Descriptive: element prefix + noun (e.g. `orbfire`, `scrollwater`, `rubeuscentrum`)
- For generic animated placeholders, use short noun + no element (e.g. `loworb`, `whorl`, `trueanima`)

### Sections in the file (add to the correct block)

The `items` object has these comment-delimited sections. Insert new items in the most appropriate section or add a new `// Section name` comment block:

- General materials: rupie, crystal, prisms, merits, centrums, bricks...
- `// Dragon Scales`
- `// High Orbs` / `// Low Orbs`
- `// Scrolls` / `// Tomes` / `// Grimoires`
- `// True Anima` / `// Whorls` / `// Centrums`
- `// Treasures`
- `// Co-op Rotating Showdown Item` / `// Class distinctions`
- `// Elemental Quartz` / `// Trial Fragment` / `// Urn`
- `// Weapon Stones` / `// Rusted weapons` / `// Silver Shards` / `// Silver relics`
- `// Revenant weapons` / `// Revenant Weapon Fragment`
- `// Astra` / `// Idean` / `// Veritas` / `// Verum` / `// Luster` / `// Haze`
- `// Arcarum Fragment` / `// Gospel`
- `// Anima` / `// Omega Anima` / `// Omega Unique items` / `// Omega 2 Omega Anima`
- `// Six-Dragon Advent` / `// Six-Dragon Jewels`
- `// Tier 1 Summon Anima` / `// Tier 2 Summon Anima`
- `// Primarch Anima` / `// Halo` / `// Sacred beasts Omega Anima`

### If it belongs to an element group

Also add a corresponding entry to the `groups` object at the bottom of the file. Groups have type `GroupType.element` or `GroupType.summon`.

**Element group template:**
```js
mygroupname: {
  type: GroupType.element,
  fire: 'mygroupfire',
  water: 'mygroupwater',
  earth: 'mygroupearth',
  wind: 'mygroupwind',
  light: 'mygrouplightORarray',
  dark: 'mygroupdarkORarray'
},
```

For light/dark that share items with other elements, use an array:
```js
light: ['itemkey1', 'itemkey2'],
```

**Summon group template** (keyed by summon ID):
```js
mygroupname: {
  type: GroupType.summon,
  2040236: 'itemkey',
  2040237: 'itemkey',
  // ... through 2040245
},
```

---

## Adding Steps (option B/C) — MaterialStep format

```js
new MaterialStep('Step label shown in UI',
  [
    {"item":"itemkey","q":QUANTITY},
    {"group":"groupname","q":QUANTITY},
  ]
),
```

- Use `"item"` for a specific item key from `supplies.js`.
- Use `"group"` for a named group from `supplies.js` — quantity is applied per resolved item.
- Steps are inserted in order — confirm with the user where in the array the new step goes (index, or "after X step").

**supplies-eternals.js** — steps are in `ETERNALS_DATA.materials[]`. They cover Eternal upgrade from 4★ → 6★ Transcendence Stage 5.

**supplies-evokers.js** — steps are in `EVOKERS_DATA.materials[]`. They cover Evoker path from SR Summon 0★ through Unlock 4th Skill.

---

## Workflow

1. Read the current file(s) to see exact content before editing.
2. Show the user a **preview** of the new lines you plan to insert.
3. After confirmation, make the edit with the Edit tool.
4. If new item keys are referenced in steps but don't yet exist in `supplies.js`, add them first.
5. Verify no typos in item/group keys by checking `supplies.js`.
6. Report what was added and where.

Do not add image files — images are managed separately in `public/img/item/`.
Do not modify `CLAUDE.md`, `README.md`, or `PRD.md` for data-only additions.
