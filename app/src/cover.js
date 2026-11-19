// Palm Sunset Studio — cover renderer.
// Paints a GTA-style poster cover onto any 2D canvas: photo panels, a Vice City
// sunset or neon grade, procedural poster art (a slatted setting sun, palm and
// skyline silhouettes, a poster frame, film grain and halftone dots) and a
// poster lettering block (big title, subtitle, tagline and a place stamp).
// Pure drawing, so the live preview and the exported PNG are the same art.

// Nine layout templates, each with its panel count.
export const LAYOUTS = {
  full: { panels: 1, label: 'One photo, full-bleed' },
  duo: { panels: 2, label: 'Two tall panels' },
  trio: { panels: 3, label: 'Three panels' },
  grid: { panels: 4, label: 'Four-panel grid' },
  hero: { panels: 3, label: 'Hero photo + strip' },
  collage: { panels: 7, label: 'Key-art collage' },
  stack: { panels: 3, label: 'Three stacked strips' },
  mosaic: { panels: 6, label: 'Six-panel mosaic' },
  banner: { panels: 2, label: 'Banner + big panel' },
};

// Seven colour grades: the Vice City sunset and neon looks.
export const GRADES = {
  sunset: { label: 'Sunset' },
  vice: { label: 'Vice Heat' },
  neon: { label: 'Neon' },
  miami: { label: 'Miami Nights' },
  dusk: { label: 'Dusk' },
  noir: { label: 'Noir' },
  pastel: { label: 'Pastel' },
};

// Six title lettering styles. Each names the font it draws in.
export const TITLE_STYLES = {
  poster: { label: 'Poster', font: 'Anton' },
  sunset: { label: 'Sunset Bold', font: 'Anton' },
  neon: { label: 'Neon Glow', font: 'Anton' },
  noir: { label: 'Noir', font: 'Bebas Neue' },
  outline: { label: 'Outline', font: 'Anton' },
  bubblegum: { label: 'Bubblegum', font: 'Anton' },
};

/** A tiny seeded generator, so grain and skylines draw the same every time. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Panel rectangles for a layout, in pixels, with thin poster gutters. */
export function panelRects(layout, w, h) {
  const g = Math.max(2, Math.round(Math.min(w, h) * 0.012));
  const halfW = (w - g) / 2;
  const halfH = (h - g) / 2;
  const thirdH = (h - 2 * g) / 3;
  switch (layout) {
    case 'duo':
      return [
        { x: 0, y: 0, w: halfW, h },
        { x: halfW + g, y: 0, w: halfW, h },
      ];
    case 'trio': {
      const left = Math.round(w * 0.62);
      return [
        { x: 0, y: 0, w: left - g, h },
        { x: left, y: 0, w: w - left, h: halfH },
        { x: left, y: halfH + g, w: w - left, h: halfH },
      ];
    }
    case 'grid':
      return [
        { x: 0, y: 0, w: halfW, h: halfH },
        { x: halfW + g, y: 0, w: halfW, h: halfH },
        { x: 0, y: halfH + g, w: halfW, h: halfH },
        { x: halfW + g, y: halfH + g, w: halfW, h: halfH },
      ];
    case 'hero': {
      const top = Math.round(h * 0.66);
      return [
        { x: 0, y: 0, w, h: top - g },
        { x: 0, y: top, w: halfW, h: h - top },
        { x: halfW + g, y: top, w: halfW, h: h - top },
      ];
    }
    case 'collage': {
      const side = Math.round((w - 2 * g) * 0.22);
      const mid = w - 2 * side - 2 * g;
      const rows = [0, thirdH + g, 2 * (thirdH + g)].map((y) => ({ y, h: thirdH }));
      const out = [{ x: side + g, y: 0, w: mid, h }];
      rows.forEach((r) => {
        out.push({ x: 0, y: r.y, w: side, h: r.h });
        out.push({ x: side + g + mid + g, y: r.y, w: side, h: r.h });
      });
      return out;
    }
    case 'stack':
      return [0, 1, 2].map((i) => ({ x: 0, y: i * (thirdH + g), w, h: thirdH }));
    case 'mosaic': {
      const rows = [0, thirdH + g, 2 * (thirdH + g)];
      return rows.flatMap((y) => [
        { x: 0, y, w: halfW, h: thirdH },
        { x: halfW + g, y, w: halfW, h: thirdH },
      ]);
    }
    case 'banner': {
      const top = Math.round(h * 0.3);
      return [
        { x: 0, y: 0, w, h: top - g },
        { x: 0, y: top, w, h: h - top },
      ];
    }
    case 'full':
    default:
      return [{ x: 0, y: 0, w, h }];
  }
}

/** Paints one photo into a panel rect, cover-fit, with the panel's crop. */
export function paintPhoto(ctx, photo, rect, panel) {
  if (!photo) return false;
  const zoom = panel.zoom ?? 1;
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox ?? 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy ?? 0) * rect.h;
  ctx.drawImage(photo, dx, dy, dw, dh);
  return true;
}

/** Placeholder art for a panel with no photo yet: a warm gradient and a label. */
export function paintEmptyPanel(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#3d1d4e');
  grad.addColorStop(1, '#c2417a');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `bold ${Math.max(12, Math.round(rect.h * 0.08))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Darkens the cover's corners so the lettering reads on any photo. */
export function paintVignette(ctx, w, h, strength) {
  const v = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** A warm radial glow, used by the sunset grades to fake low sun. */
export function paintSunGlow(ctx, w, h, strength) {
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, w * 0.4);
  glow.addColorStop(0, `rgba(255,180,90,${strength})`);
  glow.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

/** The colour grade: a wash of sunset, Vice heat, neon or dusk over the cover. */
export function paintGrade(ctx, grade, w, h) {
  let wash;
  if (grade === 'sunset') {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(255,94,77,0)');
    wash.addColorStop(0.45, 'rgba(255,120,60,0.10)');
    wash.addColorStop(1, 'rgba(190,30,110,0.38)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    paintSunGlow(ctx, w, h, 0.3);
  } else if (grade === 'vice') {
    wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255,0,110,0.10)');
    wash.addColorStop(0.5, 'rgba(255,90,40,0.16)');
    wash.addColorStop(1, 'rgba(255,170,40,0.24)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    paintSunGlow(ctx, w, h, 0.34);
    paintVignette(ctx, w, h, 0.18);
  } else if (grade === 'neon') {
    wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255,0,128,0.20)');
    wash.addColorStop(1, 'rgba(0,229,255,0.20)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    paintVignette(ctx, w, h, 0.34);
  } else if (grade === 'miami') {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(0,220,200,0.16)');
    wash.addColorStop(0.55, 'rgba(255,60,160,0.10)');
    wash.addColorStop(1, 'rgba(255,120,40,0.22)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    paintSunGlow(ctx, w, h, 0.22);
    paintVignette(ctx, w, h, 0.2);
  } else if (grade === 'dusk') {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(20,10,60,0.05)');
    wash.addColorStop(1, 'rgba(10,8,40,0.52)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    paintVignette(ctx, w, h, 0.3);
  } else if (grade === 'noir') {
    ctx.fillStyle = 'rgba(8,8,16,0.22)';
    ctx.fillRect(0, 0, w, h);
    paintVignette(ctx, w, h, 0.42);
  } else { // pastel
    wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255,183,197,0.16)');
    wash.addColorStop(1, 'rgba(255,223,186,0.20)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  }
}

/** A retro slatted sun: a disc of horizontal bands, gaps widening toward the bottom. */
export function paintSlattedSun(ctx, cx, cy, r) {
  const bands = 9;
  const sky = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  sky.addColorStop(0, '#ffe259');
  sky.addColorStop(0.55, '#ff7e3d');
  sky.addColorStop(1, '#ff2e7e');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sky;
  for (let i = 0; i < bands; i++) {
    const top = cy - r + (i * 2 * r) / bands;
    const full = (2 * r) / bands;
    const drop = (i / bands) * (i / bands);
    const height = full * (0.86 - 0.62 * drop);
    ctx.fillRect(cx - r, top, 2 * r, Math.max(1, height));
  }
  ctx.restore();
}

/** One palm silhouette: a leaning trunk and a fan of drooping fronds. */
export function paintPalm(ctx, x, baseY, size, lean, flip) {
  const dir = flip ? -1 : 1;
  const topX = x + lean * size * dir;
  const topY = baseY - size;
  ctx.strokeStyle = '#1c0b2e';
  ctx.fillStyle = '#1c0b2e';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * size * 0.25 * dir, baseY - size * 0.55, topX, topY);
  ctx.stroke();
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const angle = Math.PI * (0.08 + (i / (fronds - 1)) * 0.84);
    const reach = size * (0.42 + 0.14 * Math.sin((i / (fronds - 1)) * Math.PI));
    const tipX = topX + Math.cos(angle) * reach * dir;
    const tipY = topY - Math.sin(angle) * reach * 0.42 + reach * 0.22;
    const midX = topX + Math.cos(angle) * reach * 0.55 * dir;
    const midY = topY - Math.sin(angle) * reach * 0.62;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + (tipX - midX) * 0.25, midY + reach * 0.2, topX, topY);
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(topX, topY, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Art Deco skyline silhouettes along the bottom edge, heights from a fixed seed. */
export function paintSkyline(ctx, w, h) {
  const rnd = seededRandom(77);
  const base = h;
  const color = 'rgba(22,10,36,0.88)';
  ctx.fillStyle = color;
  let x = 0;
  while (x < w) {
    const bw = w * (0.04 + rnd() * 0.05);
    const bh = h * (0.06 + rnd() * 0.08);
    ctx.fillRect(x, base - bh, bw, bh);
    if (rnd() > 0.5) {
      const sw = bw * (0.4 + rnd() * 0.25);
      ctx.fillRect(x + (bw - sw) / 2, base - bh - h * 0.03, sw, h * 0.03);
    }
    if (rnd() > 0.82) {
      ctx.beginPath();
      ctx.moveTo(x + bw * 0.42, base - bh - h * 0.03);
      ctx.lineTo(x + bw * 0.5, base - bh - h * 0.085);
      ctx.lineTo(x + bw * 0.58, base - bh - h * 0.03);
      ctx.closePath();
      ctx.fill();
    }
    x += bw + w * 0.004;
  }
}

/** A thick off-white poster border with a thin inner rule. */
export function paintPosterFrame(ctx, w, h) {
  const bw = Math.max(6, Math.round(Math.min(w, h) * 0.028));
  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, w, bw);
  ctx.fillRect(0, h - bw, w, bw);
  ctx.fillRect(0, 0, bw, h);
  ctx.fillRect(w - bw, 0, bw, h);
  ctx.strokeStyle = 'rgba(20,10,30,0.35)';
  ctx.lineWidth = Math.max(1, bw * 0.08);
  ctx.strokeRect(bw * 1.6, bw * 1.6, w - bw * 3.2, h - bw * 3.2);
}

/** Film grain: seeded speckles, the same on every render. */
export function paintGrain(ctx, w, h) {
  const rnd = seededRandom(2026);
  const count = Math.floor((w * h) / 1100);
  for (let i = 0; i < count; i++) {
    const light = rnd() > 0.5;
    ctx.fillStyle = light ? `rgba(255,255,255,${0.03 + rnd() * 0.05})` : `rgba(0,0,0,${0.03 + rnd() * 0.06})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1 + Math.floor(rnd() * 2), 1 + Math.floor(rnd() * 2));
  }
}

/** A faint halftone dot screen, the printed-poster feel. */
export function paintHalftone(ctx, w, h) {
  const step = 9;
  ctx.fillStyle = 'rgba(20,8,30,0.055)';
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Wraps text into lines that fit the width. */
export function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/** The poster lettering block: title, subtitle, tagline and place stamp. */
export function paintLettering(ctx, lettering, w, h) {
  const title = (lettering.title ?? '').trim().toUpperCase();
  if (!title) return;
  const style = TITLE_STYLES[lettering.style] ?? TITLE_STYLES.poster;
  const ink = lettering.color ?? '#ffffff';
  const tracking = lettering.tracking ?? 0.06;
  const place = lettering.place ?? 'bottom';
  const frame = Math.max(6, Math.round(Math.min(w, h) * 0.028));

  // Title size: start from the requested fraction of the height, shrink to fit two lines.
  let size = h * (lettering.size ?? 0.13);
  const setTitleFont = (s) => {
    ctx.font = `${s}px "${style.font}", "Arial Black", sans-serif`;
    ctx.letterSpacing = `${Math.round(s * tracking)}px`;
  };
  setTitleFont(size);
  const titleMax = w * 0.9;
  while (size > 16 && wrapText(ctx, title, titleMax).length > 2) {
    size -= 2;
    setTitleFont(size);
  }
  const titleLines = wrapText(ctx, title, titleMax);
  const titleLineH = size * 1.05;

  const subOn = (lettering.subtitle ?? '').trim().length > 0;
  const tagOn = (lettering.tagline ?? '').trim().length > 0;
  const stampOn = lettering.stamp && (lettering.stampText ?? '').trim().length > 0;
  const subSize = size * 0.26;
  const tagSize = Math.max(13, size * 0.19);
  const stampSize = Math.max(12, size * 0.17);

  let blockH = titleLines.length * titleLineH;
  if (subOn) blockH += subSize * 2.2;
  if (tagOn) blockH += tagSize * 1.7;
  if (stampOn) blockH += stampSize * 2.4;

  let top;
  if (place === 'top') top = h * 0.06 + frame;
  else if (place === 'center') top = (h - blockH) / 2;
  else top = h - h * 0.06 - frame - blockH;

  const cx = w / 2;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(cx, top + blockH / 2);
  if (lettering.style === 'poster' || lettering.style === 'sunset') ctx.rotate(-0.03);
  ctx.translate(-cx, -(top + blockH / 2));

  let y = top;
  if (subOn) {
    ctx.font = `${subSize}px "Bebas Neue", sans-serif`;
    ctx.letterSpacing = `${Math.round(subSize * 0.42)}px`;
    ctx.fillStyle = '#ffd23e';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = subSize * 0.2;
    ctx.shadowOffsetY = subSize * 0.05;
    ctx.fillText(lettering.subtitle.trim().toUpperCase(), cx, y + subSize * 0.9);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    y += subSize * 2.2;
  }

  // Title, one line at a time.
  setTitleFont(size);
  if (lettering.shadow !== false) {
    if (lettering.style === 'neon') {
      ctx.shadowColor = '#ff2ea6';
      ctx.shadowBlur = size * 0.28;
      ctx.shadowOffsetY = size * 0.03;
    } else if (lettering.style === 'bubblegum') {
      ctx.shadowColor = 'rgba(120,0,80,0.65)';
      ctx.shadowBlur = size * 0.16;
      ctx.shadowOffsetY = size * 0.05;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = size * 0.14;
      ctx.shadowOffsetY = size * 0.04;
    }
  }
  titleLines.forEach((lineText, i) => {
    const ly = y + titleLineH * (i + 0.5);
    if (lettering.style === 'outline') {
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeStyle = ink;
      ctx.strokeText(lineText, cx, ly);
    } else {
      if (lettering.outline !== false) {
        ctx.lineWidth = Math.max(2, size * (lettering.style === 'noir' ? 0.05 : 0.13));
        ctx.strokeStyle = lettering.style === 'bubblegum' ? '#ffffff'
          : lettering.style === 'neon' ? '#ff2ea6'
          : '#1a0b2e';
        ctx.lineJoin = 'round';
        ctx.strokeText(lineText, cx, ly);
      }
      if (lettering.style === 'poster') {
        const grad = ctx.createLinearGradient(cx, ly - size / 2, cx, ly + size / 2);
        grad.addColorStop(0, '#ffe259');
        grad.addColorStop(0.55, '#ff7e3d');
        grad.addColorStop(1, '#ff2e7e');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = ink;
      }
      ctx.fillText(lineText, cx, ly);
    }
  });
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  y += titleLines.length * titleLineH;

  if (tagOn) {
    ctx.font = `italic ${tagSize}px Georgia, serif`;
    ctx.letterSpacing = '0px';
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = tagSize * 0.25;
    ctx.shadowOffsetY = tagSize * 0.06;
    ctx.fillText(lettering.tagline.trim(), cx, y + tagSize * 0.85);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    y += tagSize * 1.7;
  }

  if (stampOn) {
    const stampText = lettering.stampText.trim().toUpperCase();
    ctx.font = `${stampSize}px "Bebas Neue", sans-serif`;
    ctx.letterSpacing = `${Math.round(stampSize * 0.3)}px`;
    const textW = ctx.measureText(stampText).width;
    const padX = stampSize * 0.9;
    const pillW = textW + padX * 2;
    const pillH = stampSize * 1.9;
    const pillY = y + stampSize * 0.25;
    ctx.fillStyle = 'rgba(10,5,20,0.62)';
    ctx.beginPath();
    ctx.roundRect(cx - pillW / 2, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stampText, cx, pillY + pillH / 2);
  }
  ctx.restore();
}

/** Paints the whole cover: ground, panels, grade, poster art, frame, lettering. */
export function drawCover(ctx, state, photos, w, h) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  const art = state.art ?? {};
  if (state.grade === 'noir') ctx.filter = 'grayscale(0.85) contrast(1.12)';
  rects.forEach((rect, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (art.ink) ctx.filter = 'contrast(1.22) saturate(1.45)';
    const panel = state.panels[i] ?? {};
    const photo = photos[i] ?? null;
    if (!paintPhoto(ctx, photo, rect, panel)) paintEmptyPanel(ctx, rect, i);
    ctx.restore();
  });
  ctx.filter = 'none';
  paintGrade(ctx, state.grade, w, h);
  if (art.sun) {
    paintSlattedSun(ctx, w * 0.74, h * 0.2, Math.min(w, h) * 0.15);
  }
  if (art.skyline) paintSkyline(ctx, w, h);
  if (art.palms) {
    const s = Math.min(w, h) * 0.3;
    paintPalm(ctx, w * 0.04, h * 0.985, s, 0.35, false);
    paintPalm(ctx, w * 0.97, h * 0.985, s * 0.82, 0.3, true);
  }
  if (art.frame) paintPosterFrame(ctx, w, h);
  if (art.grain) paintGrain(ctx, w, h);
  if (art.halftone) paintHalftone(ctx, w, h);
  paintLettering(ctx, state.lettering, w, h);
  ctx.restore();
}
