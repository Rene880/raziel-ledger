# download-images

You are helping the user download **item/material icons** into `public/img/item/` for the Raziel
Ledger calculators. This is the companion to the `add-supplies` skill: `add-supplies` adds the data
to `src/js/supplies.js` but explicitly does **not** add images — this skill fills that gap.

Icons are fetched through WikiParser's `download()` function (its `update_img.py` is the standalone
item-image fetcher — PRD §10). Icons are sourced from the official game CDN, or from
[gbf.wiki](https://gbf.wiki) where a CDN id isn't known. This skill adds lines to the
`data/supplies.images` manifest (or a separate `data/*.images` file) and downloads them.

This is the same flow used for the v1.2 Radiance icons — see **PRD §9.5** for the precedent.

---

## What you need

For each icon, two things:

1. **The item key** as it appears in `src/js/supplies.js` (e.g. `terraadamant`, `fireomega3omegaanima`).
   The downloaded file must be named `<itemKey>.jpg` so components find it.
2. **The gbf.wiki file name** for the icon. The convention is the item's **display Name** + ` square.jpg`.

You usually don't have to ask for #2: read the item's `Name` from `supplies.js` and derive it.

### Deriving the gbf.wiki URL from a display name

- Square icon file name: `<Display Name> square.jpg` (e.g. `Terra Adamant square.jpg`).
- Build the URL with the MediaWiki file redirect, which 302s to the real image:

  ```
  https://gbf.wiki/Special:Redirect/file/<File_Name>
  ```
- Replace spaces with `_`. **URL-encode apostrophes as `%27`** (e.g. `Wilnas's Jewel` →
  `Wilnas%27s_Jewel_square.jpg`). Other punctuation: encode as needed (`%2C` for `,`).

Existing icons came from this exact source — `public/img/item/fireomega2omegaanima.jpg` even embeds
`File source: http://gbf.wiki/File:Shiva_Omega_Anima_square.jpg`. Static icons are ~120–130 px square JPEGs.

---

## Workflow

1. **Confirm the keys + names.** List each `itemKey` → `<File Name>_square.jpg` you intend to fetch.
   For keys already in `supplies.js`, read their `Name` to derive the file name; show the user the
   table before downloading.

2. **Author the manifest** — add your `URL⇥dest` lines to `WikiParser/data/supplies.images` (the
   canonical manifest), or create a separate `WikiParser/data/<name>.images` for a one-off batch. One
   **tab-separated** line per icon — `URL⇥dest`, where `dest` is just the file name:
   ```
   https://gbf.wiki/Special:Redirect/file/Terra_Adamant_square.jpg	terraadamant.jpg
   https://gbf.wiki/Special:Redirect/file/Ira_Omega_Anima_square.jpg	fireomega3omegaanima.jpg
   ```
   The separator **must be a real tab** (`download()` splits on `\t`). Prefer the official CDN URL
   when the item's `itemId` is known (see `About items.md`); fall back to the gbf.wiki redirect above.

3. **Download** via WikiParser's own function (run from the `WikiParser/` dir; `download()` only
   writes on HTTP 200 and skips files that already exist):
   ```sh
   # whole manifest (default dest is ../public/img/item):
   cd WikiParser && python3 update_img.py
   # …or a single one-off manifest into the item dir explicitly:
   cd WikiParser && python3 -c "import update_img; update_img.download('data/<name>.images', '../public/img/item')"
   ```
   `download(manifest, dest_dir)` reads only the file you pass; `python3 update_img.py [manifest] [dest]`
   defaults to `data/supplies.images` → `../public/img/item`.

4. **Verify** every icon:
   ```sh
   for k in <itemKey> ...; do file "public/img/item/$k.jpg"; done   # expect 'JPEG image data', ~130x130
   ls public/img/item | wc -l                                        # increased by the expected count
   ```
   A missing file means that URL 404'd → the manifest URL is wrong; fix it and re-run.

5. **Report** what was downloaded and the new file count.

---

## Notes & edge cases

- **Animated items** (`new Item(..., true)` in `supplies.js`, e.g. `loworb`, `whorl`, `trueanima`)
  use a `.gif`, not a `.jpg`, from a different source. This skill targets the common static-JPEG
  case; flag animated ones to the user rather than guessing.
- **One image per item** is the rule (PRD §8 sweep). Name the file exactly `<itemKey>.jpg` — a
  mismatch renders a broken image (see the historical `silvershardmelee` → `silvershardgauntlet`
  fix in PRD §8).
- **Be mindful of source bandwidth** (WikiParser README): batch small, don't re-download — `download()`
  already skips existing files.
- After downloading, the matching item must exist in `supplies.js` (use `add-supplies` for that).
