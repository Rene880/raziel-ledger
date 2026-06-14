# WikiParser

A standalone item-image fetcher for Raziel Ledger. It downloads the calculators'
item/material icons into the web app's `public/img/item/` directory from a
hand-authored manifest.

Icons are sourced from the official game CDN (and, where needed, from
[gbf.wiki](https://gbf.wiki/)). **Please use this responsibly** — be mindful of
source bandwidth; the script already skips files that already exist.

> Originally the full GranblueParty wiki-scraping / PostgreSQL pipeline; reduced
> in v1.2.5 to just the item-image fetcher Raziel Ledger actually uses. Remains
> GPL-3.0 (see `LICENSE`).

## Requirements
- Python 3
- `requests` (`pip3 install -r requirements.txt`)

## Usage
Run from the `WikiParser/` directory:

```
python3 update_img.py [manifest] [dest_dir]
```

- `manifest` — tab-separated `URL⇥destfilename` lines (default: `data/supplies.images`).
- `dest_dir` — where icons are written (default: `../public/img/item`).

Existing files are skipped, so re-running is a no-op. Each item icon must be named
`<itemKey>.<jpg|gif>` so the calculator components resolve it; `npm test`
(`scripts/check-item-images.js`) verifies every `supplies.js` item has its icon.

The manifest is maintained via the `/download-images` skill (companion to
`/add-supplies`).
