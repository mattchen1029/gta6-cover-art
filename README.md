# Neon Cover Studio — GTA 6-style cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mattchen1029/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mattchen1029/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your photo and a caption into GTA 6-style cover art — the multi-panel poster
look with bold caption lettering and a Vice City sunset or neon colour grade —
exported as a PNG to share. Built for the
[make.fun GTA 6 cover art bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **Your photos, your panels** — upload photos from your machine or use the four
  shipped sample photos; fill one panel or several, one photo or many.
- **Five layouts** — single full-bleed, two panels, three panels, four-panel grid,
  and hero photo with a strip below.
- **Crop and position each panel** — drag the photo on the cover, scroll to zoom,
  or use the zoom / pan sliders; reset a crop or use one photo everywhere.
- **Captions** — write and edit the caption, with size, top / centre / bottom
  placement, five colours, five preset lettering styles (Sunset Bold, Neon Glow,
  Noir, Outline, Bubblegum), outline and shadow/glow toggles.
- **Five colour grades** — Sunset, Neon, Dusk, Noir, Pastel.
- **Undo / redo**, and the project is saved in the browser (`localStorage`), so a
  reload keeps your work.
- **Export** as a PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

Open `app/index.html` in desktop Chrome. The app is static files with no build
step and works with no network request: every script, font and sample ships under
`app/`, and photos are read on your own machine, never uploaded.

## Fonts and photos

- Lettering uses Anton and Bebas Neue, shipped under `app/fonts/` under the SIL
  Open Font License (see `app/fonts/OFL.txt`).
- The four sample photos under `app/samples/` were made with an image model and
  are free to use. The app contains no Rockstar Games logo, wordmark, official
  artwork, character or game font.

## License

MIT — see [LICENSE](LICENSE).
