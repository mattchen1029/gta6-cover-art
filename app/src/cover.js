// Cover renderer for Neon Cover Studio: the multi-panel GTA-style poster look.
// Pure drawing: given a state and the loaded photos, it paints the cover onto any
// 2D canvas at any size, so the live preview and the exported PNG are the same art.

/** Layout templates: how many panels each one holds. */
export const LAYOUTS = {
  full: { panels: 1, label: 'Single full-bleed' },
  duo: { panels: 2, label: 'Two panels' },
  trio: { panels: 3, label: 'Three panels' },
  grid: { panels: 4, label: 'Four-panel grid' },
  hero: { panels: 3, label: 'Hero + strip' },
};

/** Colour grades: the Vice City sunset / neon looks. */
export const GRADES = {
  sunset: { label: 'Sunset' },
  neon: { label: 'Neon' },
  dusk: { label: 'Dusk' },
  noir: { label: 'Noir' },
  pastel: { label: 'Pastel' },
};

/** Caption presets: lettering styles, each with its own font, stroke and glow. */
export const CAPTION_STYLES = {
  sunset: { label: 'Sunset Bold', font: 'Anton' },
  neon: { label: 'Neon Glow', font: 'Anton' },
  noir: { label: 'Noir', font: 'Bebas Neue' },
  outline: { label: 'Outline', font: 'Anton' },
  bubblegum: { label: 'Bubblegum', font: 'Anton' },
};

/** Panel rectangles for a layout, in pixels, with thin poster gutters between them. */
export function layoutPanels(layout, w, h) {
  const g = Math.max(2, Math.round(Math.min(w, h) * 0.014));
  const full = [{ x: 0, y: 0, w, h }];
  switch (layout) {
    case 'full': return full;
    case 'duo':
      return [
        { x: 0, y: 0, w: (w - g) / 2, h },
        { x: (w + g) / 2, y: 0, w: (w - g) / 2, h },
      ];
    case 'trio': {
      const left = Math.round(w * 0.62);
      return [
        { x: 0, y: 0, w: left - g, h },
        { x: left, y: 0, w: w - left, h: (h - g) / 2 },
        { x: left, y: (h + g) / 2, w: w - left, h: (h - g) / 2 },
      ];
    }
    case 'grid':
      return [
        { x: 0, y: 0, w: (w - g) / 2, h: (h - g) / 2 },
        { x: (w + g) / 2, y: 0, w: (w - g) / 2, h: (h - g) / 2 },
        { x: 0, y: (h + g) / 2, w: (w - g) / 2, h: (h - g) / 2 },
        { x: (w + g) / 2, y: (h + g) / 2, w: (w - g) / 2, h: (h - g) / 2 },
      ];
    case 'hero': {
      const top = Math.round(h * 0.66);
      return [
        { x: 0, y: 0, w, h: top - g },
        { x: 0, y: top, w: (w - g) / 2, h: h - top },
        { x: (w + g) / 2, y: top, w: (w - g) / 2, h: h - top },
      ];
    }
    default: return full;
  }
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, panel) {
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

/** Placeholder art for an empty panel: a warm gradient with its panel number. */
export function drawEmptyPanel(ctx, rect, index) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#3d1d4e');
  grad.addColorStop(1, '#c2417a');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `bold ${Math.round(rect.h * 0.09)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** The colour grade: a wash of sunset, neon, dusk, noir or pastel over the whole cover. */
export function applyGrade(ctx, grade, w, h) {
  let wash;
  if (grade === 'sunset') {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(255,94,77,0)');
    wash.addColorStop(0.45, 'rgba(255,120,60,0.10)');
    wash.addColorStop(1, 'rgba(190,30,110,0.38)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, w * 0.38);
    sun.addColorStop(0, 'rgba(255,180,90,0.30)');
    sun.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (grade === 'neon') {
    wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255,0,128,0.20)');
    wash.addColorStop(1, 'rgba(0,229,255,0.20)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    applyVignette(ctx, w, h, 0.34);
  } else if (grade === 'dusk') {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(20,10,60,0.05)');
    wash.addColorStop(1, 'rgba(10,8,40,0.52)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    applyVignette(ctx, w, h, 0.3);
  } else if (grade === 'noir') {
    ctx.fillStyle = 'rgba(8,8,16,0.22)';
    ctx.fillRect(0, 0, w, h);
    applyVignette(ctx, w, h, 0.42);
  } else { // pastel
    wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255,183,197,0.16)');
    wash.addColorStop(1, 'rgba(255,223,186,0.20)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Darkens the cover's corners so the caption lettering reads anywhere. */
export function applyVignette(ctx, w, h, strength) {
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** Wraps the caption into lines that fit the cover width. */
export function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
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

/** Draws the bold caption lettering with its preset style, outline and glow. */
export function drawCaption(ctx, caption, w, h) {
  const text = (caption.text ?? '').trim().toUpperCase();
  if (!text) return;
  const style = CAPTION_STYLES[caption.style] ?? CAPTION_STYLES.sunset;
  const base = h * (caption.size ?? 0.11);
  let size = base;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = (s) => { ctx.font = `${s}px "${style.font}", "Arial Black", sans-serif`; };
  setFont(size);
  while (size > 14 && wrapCaption(ctx, text, w * 0.92).length > 2) {
    size -= 2;
    setFont(size);
  }
  const lines = wrapCaption(ctx, text, w * 0.92);
  const lineHeight = size * 1.04;
  const blockH = lines.length * lineHeight;
  let top;
  if (caption.place === 'top') top = h * 0.07;
  else if (caption.place === 'center') top = (h - blockH) / 2;
  else top = h - h * 0.07 - blockH;
  const cx = w / 2;
  const cy = top + blockH / 2;
  const tilt = caption.style === 'sunset' ? -0.035 : 0;
  ctx.save();
  ctx.translate(cx, cy);
  if (tilt) ctx.rotate(tilt);
  ctx.translate(-cx, -cy);
  if (caption.shadow !== false) {
    if (caption.style === 'neon') {
      ctx.shadowColor = '#ff2ea6';
      ctx.shadowBlur = size * 0.35;
      ctx.shadowOffsetY = size * 0.03;
    } else if (caption.style === 'bubblegum') {
      ctx.shadowColor = 'rgba(120,0,80,0.65)';
      ctx.shadowBlur = size * 0.16;
      ctx.shadowOffsetY = size * 0.05;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = size * 0.14;
      ctx.shadowOffsetY = size * 0.04;
    }
  }
  const fill = caption.color ?? '#ffffff';
  lines.forEach((lineText, i) => {
    const y = top + lineHeight * (i + 0.5);
    if (caption.style === 'outline') {
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeStyle = fill;
      ctx.strokeText(lineText, cx, y);
    } else {
      if (caption.outline !== false) {
        ctx.lineWidth = Math.max(2, size * (caption.style === 'noir' ? 0.05 : 0.13));
        ctx.strokeStyle = caption.style === 'bubblegum' ? '#ffffff'
          : caption.style === 'neon' ? '#ff2ea6' : '#1a0b2e';
        ctx.lineJoin = 'round';
        ctx.strokeText(lineText, cx, y);
      }
      ctx.fillStyle = fill;
      ctx.fillText(lineText, cx, y);
    }
  });
  ctx.restore();
}

/** Paints the whole cover: off-white poster ground, panels, grade, caption. */
export function drawCover(ctx, state, photos, w, h) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout, w, h);
  if (state.grade === 'noir') ctx.filter = 'grayscale(0.85) contrast(1.12)';
  rects.forEach((rect, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const panel = state.panels[i] ?? {};
    const photo = photos[i] ?? null;
    if (!drawPanelPhoto(ctx, photo, rect, panel)) drawEmptyPanel(ctx, rect, i);
    ctx.restore();
  });
  ctx.filter = 'none';
  applyGrade(ctx, state.grade, w, h);
  drawCaption(ctx, state.caption, w, h);
  ctx.restore();
}
