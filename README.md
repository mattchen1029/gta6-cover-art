# Palm Sunset Studio — GTA 6-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mattchen1029/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mattchen1029/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photo and a caption into GTA 6-style cover art — the multi-panel poster
look with a big poster title, subtitle, tagline and place stamp, a Vice City sunset
or neon colour grade, and procedural poster art (a slatted setting sun, palm and
skyline silhouettes, a poster frame) — exported as a PNG to share. Built for the
[make.fun GTA 6 cover art bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **Your photos, your panels** — upload photos from your machine or use the six
  shipped sample photos; fill one panel or several, one photo or many.
- **Nine layouts** — single full-bleed, two panels, three panels, four-panel grid,
  hero photo with a strip below, key-art collage, three stacked strips, six-panel
  mosaic, and banner with a big panel.
- **Crop and position each panel** — drag the photo on the cover, scroll to zoom,
  or use the zoom / pan sliders; reset a crop or use one photo everywhere.
- **Detailed lettering** — a big title plus a subtitle, a tagline and a place
  stamp, with title size, letter spacing, top / centre / bottom placement, five
  colours, six preset lettering styles (Poster, Sunset Bold, Neon Glow, Noir,
  Outline, Bubblegum), outline and shadow/glow toggles.
- **Poster art, drawn by the app** — a slatted setting sun, palm silhouettes, an
  Art Deco skyline, a poster frame, film grain, halftone dots and an ink
  posterize finish, each switchable.
- **Seven colour grades** — Sunset, Vice Heat, Neon, Miami Nights, Dusk, Noir,
  Pastel.
- **Undo / redo**, and the project is saved in the browser (`localStorage`), so a
  reload keeps your work.
- **Export** as a PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

To try it in the browser instead, run `node serve.ts` (serves app/ at http://localhost:8080) and open `app/index.html` in desktop Chrome. The app is static files with no build
step and works with no network request: every script, font and sample ships under
`app/`, and photos are read on your own machine, never uploaded.

## Fonts and photos

- Lettering uses Anton and Bebas Neue, shipped under `app/fonts/` under the SIL
  Open Font License (see `app/fonts/OFL.txt`).
- The six sample photos under `app/samples/` were made with an image model and
  are free to use. The app contains no Rockstar Games logo, wordmark, official
  artwork, character or game font.

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=r2d6z7t8&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
