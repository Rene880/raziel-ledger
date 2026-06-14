# download-images

You are helping the user download **item/material icons** into `public/img/item/` for the Raziel
Ledger calculators. This is the companion to the `add-supplies` skill: `add-supplies` adds the data
to `src/js/supplies.js` but explicitly does **not** add images — this skill fills that gap.

Icons are fetched from [gbf.wiki](https://gbf.wiki) and driven through WikiParser's **existing**
`download()` function. **Do not modify any WikiParser `.py` file** — it is preserved verbatim (PRD
G4). This skill only adds a `data/*.images` manifest and (if missing) `config/config.ini`.

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

2. **Ensure `config.ini` exists** (only needed so `update_img.py` imports cleanly — its module level
   reads the `[path]` section):
   ```sh
   test -f WikiParser/config/config.ini || cp WikiParser/config/config.ini.template WikiParser/config/config.ini
   ```

3. **Author the manifest** `WikiParser/data/<name>.images` (pick a descriptive `<name>`, e.g.
   `radiance`). One **tab-separated** line per icon — `URL⇥dest`, where `dest` is just the file name:
   ```
   https://gbf.wiki/Special:Redirect/file/Terra_Adamant_square.jpg	terraadamant.jpg
   https://gbf.wiki/Special:Redirect/file/Ira_Omega_Anima_square.jpg	fireomega3omegaanima.jpg
   ```
   The separator **must be a real tab** (`update_img.download()` splits on `\t`).

4. **Download** via WikiParser's own function (run from the `WikiParser/` dir; `download()` only
   writes on HTTP 200 and skips files that already exist):
   ```sh
   cd WikiParser && python3 -c "import update_img; update_img.download('data/<name>.images', '../public/img/item')"
   ```
   **Scope guarantee — call `download()` with your single manifest, never `update_img.main()`.**
   `download(file, root_dest)` reads only the file you pass. `main()` instead globs **every**
   `data/*.images` and `data/*.preview` (`list_image_files()` / `list_preview_files()`), which would
   re-download the unrelated summon/chara/weapon art (`summon.images`, `summon_small.images`,
   `summon_battle.preview`, `chara*.images`, `weapons.images`). Those files stay in the repo for
   WikiParser's own regeneration use, but this skill must never touch them — so always target your
   own `<name>.images` explicitly.

5. **Verify** every icon:
   ```sh
   for k in <itemKey> ...; do file "public/img/item/$k.jpg"; done   # expect 'JPEG image data', ~130x130
   ls public/img/item | wc -l                                        # increased by the expected count
   ```
   A missing file means that URL 404'd → the gbf.wiki file name is wrong; fix it and re-run.

6. **Report** what was downloaded and the new file count.

---

## Notes & edge cases

- **Animated items** (`new Item(..., true)` in `supplies.js`, e.g. `loworb`, `whorl`, `trueanima`)
  use a `.gif`, not a `.jpg`, from a different source. This skill targets the common static-JPEG
  case; flag animated ones to the user rather than guessing.
- **One image per item** is the rule (PRD §8 sweep). Name the file exactly `<itemKey>.jpg` — a
  mismatch renders a broken image (see the historical `silvershardmelee` → `silvershardgauntlet`
  fix in PRD §8).
- **Be mindful of wiki bandwidth** (WikiParser README): batch small, don't re-download — `download()`
  already skips existing files.
- **Do not edit WikiParser `.py` files.** Only `data/*.images` and `config/config.ini` are yours to add.
- After downloading, the matching item must exist in `supplies.js` (use `add-supplies` for that).
