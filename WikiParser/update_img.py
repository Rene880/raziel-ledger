#!/usr/bin/env python3
"""Standalone item-image fetcher for Raziel Ledger.

Reads tab-separated manifests (``URL<TAB>destfilename``) and downloads each
icon into the web app's ``public/img/item/`` directory. URLs may point at
gbf.wiki (``Special:Redirect/file/...``) or the official game CDN — both are
plain HTTP GETs.

Two manifests are processed by default:
    data/supplies.images — eternal/evoker calculator items
    data/bullets.images  — Bullets calculator items (since v1.3.0)

Existing files are skipped, so re-running is a no-op. Be mindful of source
bandwidth: batch small, do not force re-downloads.

Usage:
    python3 update_img.py [manifest] [dest_dir]

Defaults: manifests=data/supplies.images + data/bullets.images,
dest_dir=../public/img/item. Passing an explicit manifest fetches only that one.
"""

import os
import sys

import requests

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MANIFESTS = [
    os.path.join(HERE, 'data', 'supplies.images'),
    os.path.join(HERE, 'data', 'bullets.images'),
]
DEFAULT_DEST = os.path.join(HERE, '..', 'public', 'img', 'item')


def download(manifest, dest_dir):
  """Download every URL in `manifest` into `dest_dir`, skipping existing files.

  Returns (new_count, failed_count).
  """
  new, failed = 0, 0
  with open(manifest, 'r', encoding='utf8') as read_file:
    for line in read_file.read().splitlines():
      if not line.strip():
        continue
      [url, name] = line.split('\t')
      dest = os.path.join(dest_dir, name)
      # Only download new files
      if os.path.isfile(dest):
        continue
      print('Downloading ' + name)
      response = requests.get(url)
      if response.ok:
        with open(dest, 'wb') as image_file:
          image_file.write(response.content)
        new += 1
      else:
        print('  Failed (%d): %s' % (response.status_code, url))
        failed += 1
  return new, failed


def main(argv):
  manifests = [argv[0]] if len(argv) > 0 else DEFAULT_MANIFESTS
  dest_dir = argv[1] if len(argv) > 1 else DEFAULT_DEST
  if not os.path.isdir(dest_dir):
    print('Destination dir not found: ' + dest_dir)
    return 1

  total_new, total_failed = 0, 0
  for manifest in manifests:
    if not os.path.isfile(manifest):
      print('Manifest not found: ' + manifest)
      return 1
    new, failed = download(manifest, dest_dir)
    total_new += new
    total_failed += failed

  print('Done. %d new, %d failed.' % (total_new, total_failed))
  return 1 if total_failed else 0


if __name__ == '__main__':
  sys.exit(main(sys.argv[1:]))
