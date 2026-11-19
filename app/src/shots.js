// Fixed scenes for screenshots: ?shot=editor shows the page with a scene loaded;
// ?shot=cover shows the cover alone, filling the window. Query parameters pick the
// layout, grade, photos, caption and export size. window.__shotReady is set once
// the fonts are loaded and the cover is painted.
export async function runShot(shot, query, api) {
  const photos = (query.get('photos') ?? query.get('photo') ?? 'neon,beach,pier').split(',');
  const scene = {
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    size: query.get('size') ?? undefined,
    caption: {
      text: query.get('caption') ?? undefined,
      style: query.get('style') ?? undefined,
      place: query.get('place') ?? undefined,
    },
    photos,
  };
  await api.setScene(scene);
  await document.fonts.ready;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    api.drawAt(window.innerWidth, window.innerHeight);
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
