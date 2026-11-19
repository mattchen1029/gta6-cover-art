// Fixed scenes for screenshots: ?shot=editor shows the page with a scene loaded;
// ?shot=cover shows the cover alone, filling the window. Query parameters pick the
// layout, grade, photos, lettering and poster art, and the export size.
// window.__shotReady is set once the fonts are loaded and the cover is painted.
export async function runShot(shot, query, api) {
  const photos = (query.get('photos') ?? query.get('photo') ?? 'neon,beach,car,palms,boulevard,pier,beach').split(',');
  const artFlags = (query.get('art') ?? '').split(',').filter(Boolean);
  const art = {};
  ['sun', 'palms', 'skyline', 'frame', 'grain', 'halftone', 'ink'].forEach((key) => {
    if (artFlags.includes(key)) art[key] = true;
    if (artFlags.includes(`no-${key}`)) art[key] = false;
  });
  const scene = {
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    size: query.get('size') ?? undefined,
    lettering: {
      title: query.get('caption') ?? query.get('title') ?? undefined,
      subtitle: query.get('subtitle') ?? undefined,
      tagline: query.get('tagline') ?? undefined,
      stampText: query.get('stamp') ?? undefined,
      style: query.get('style') ?? undefined,
      place: query.get('place') ?? undefined,
    },
    art,
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
