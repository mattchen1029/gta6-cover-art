// Neon Cover Studio editor: state, controls, undo, autosave and PNG export.
// The app runs fully offline: every photo is read on this machine, every font and
// sample ships under app/, and nothing is uploaded anywhere.
import { drawCover, layoutPanels, LAYOUTS, GRADES, CAPTION_STYLES } from './cover.js';
import { runShot } from './shots.js';

/** Free-to-use sample photos shipped with the app (image-model made). */
export const SAMPLES = [
  { id: 'neon', label: 'Neon Street', src: 'samples/neon.jpg' },
  { id: 'beach', label: 'Beach Sunset', src: 'samples/beach.jpg' },
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg' },
];

/** Export sizes: the common post sizes. */
export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080 square' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350 portrait' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080 wide' },
};

const STORE_KEY = 'neon-cover-studio-v1';
const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

/** The default project: a three-panel sunset cover. */
export function defaultState() {
  return {
    layout: 'trio',
    grade: 'sunset',
    size: '1080x1080',
    caption: { text: 'VICE NIGHTS', size: 0.11, place: 'bottom', color: '#ffffff', style: 'sunset', outline: true, shadow: true },
    panels: [
      { photo: 'neon', zoom: 1, ox: 0, oy: 0 },
      { photo: 'beach', zoom: 1, ox: 0, oy: 0 },
      { photo: 'pier', zoom: 1, ox: 0, oy: 0 },
    ],
    selected: 0,
  };
}

let state = loadSavedState();
let photos = []; // loaded HTMLImageElements, one per panel slot
let uploads = {}; // panel index -> object URL of a photo the user picked from disk
let history = [];
let historyIndex = -1;

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const fresh = defaultState();
    if (saved.layout && LAYOUTS[saved.layout]) fresh.layout = saved.layout;
    if (saved.grade && GRADES[saved.grade]) fresh.grade = saved.grade;
    if (saved.size && EXPORT_SIZES[saved.size]) fresh.size = saved.size;
    if (saved.caption) fresh.caption = { ...fresh.caption, ...saved.caption };
    if (Array.isArray(saved.panels)) {
      fresh.panels = saved.panels.slice(0, 4).map((p, i) => ({
        photo: typeof p.photo === 'string' ? p.photo : (fresh.panels[i] || {}).photo,
        zoom: clampNumber(p.zoom, 1, 3, 1),
        ox: clampNumber(p.ox, -0.5, 0.5, 0),
        oy: clampNumber(p.oy, -0.5, 0.5, 0),
      }));
    }
    return fresh;
  } catch {
    return defaultState();
  }
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Keeps the panel list the size the current layout needs, reusing photos by slot. */
export function fitPanelsToLayout(next) {
  const count = LAYOUTS[next.layout].panels;
  const panels = next.panels.slice(0, count);
  while (panels.length < count) {
    const donor = next.panels[panels.length % Math.max(1, next.panels.length)] ?? { photo: 'neon' };
    panels.push({ photo: donor.photo, zoom: 1, ox: 0, oy: 0 });
  }
  next.panels = panels;
  next.selected = Math.min(next.selected ?? 0, count - 1);
  return next;
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function photoUrlFor(panel) {
  if (!panel) return null;
  if (panel.photo === 'upload') return uploads[state.panels.indexOf(panel)] ?? null;
  const sample = SAMPLES.find((s) => s.id === panel.photo);
  return sample ? sample.src : null;
}

/** (Re)loads every panel's photo, then repaints the preview. */
export async function loadPhotos() {
  fitPanelsToLayout(state);
  photos = await Promise.all(state.panels.map(async (panel) => {
    const url = photoUrlFor(panel);
    if (!url) return null;
    try { return await loadImage(url); } catch { return null; }
  }));
  redrawPreview();
}

/** Sizes the preview canvas to the chosen export aspect and paints the cover. */
export function redrawPreview() {
  const size = EXPORT_SIZES[state.size];
  const scale = Math.min(1, 900 / Math.max(size.w, size.h));
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  drawCover(ctx, state, photos, canvas.width, canvas.height);
  syncPanelHint();
}

function syncPanelHint() {
  const hint = document.getElementById('panelHint');
  if (!hint) return;
  const count = LAYOUTS[state.layout].panels;
  const panel = state.panels[state.selected];
  const sample = SAMPLES.find((s) => s.id === panel?.photo);
  hint.textContent = `Panel ${state.selected + 1} of ${count} — ${sample ? sample.label : 'your photo'} · click the cover to pick a panel, drag to move it, scroll to zoom`;
}

/** Saves the project in this browser so a reload keeps the work. */
export function saveProject() {
  try {
    const saved = JSON.parse(JSON.stringify(state));
    saved.panels.forEach((p) => { if (p.photo === 'upload') p.photo = 'neon'; });
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  } catch { /* storage full or unavailable: the editor still works */ }
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(state));
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  syncUndoButtons();
}

function applyHistoryEntry(raw) {
  state = JSON.parse(raw);
  uploads = {};
  loadPhotos();
  syncControls();
  saveProject();
}

/** Undo: step back to the previous project state. */
export function undoProject() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  applyHistoryEntry(history[historyIndex]);
}

/** Redo: step forward to the state undo left. */
export function redoProject() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  applyHistoryEntry(history[historyIndex]);
}

function syncUndoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
}

/** A committed change: record it for undo, save it, repaint. */
export function commitChange() {
  pushHistory();
  saveProject();
  loadPhotos();
  syncControls();
}

/** Renders the cover at full export size and downloads it as a PNG. */
export async function exportCover() {
  const size = EXPORT_SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  await document.fonts.ready;
  drawCover(off.getContext('2d'), state, photos, size.w, size.h);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  statusEl.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
  return blob;
}

/** Reflects the state in every control. */
export function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  document.querySelectorAll('[data-place]').forEach((b) => b.classList.toggle('active', b.dataset.place === state.caption.place));
  document.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('active', b.dataset.color === state.caption.color));
  const captionText = document.getElementById('captionText');
  if (captionText && captionText.value !== state.caption.text) captionText.value = state.caption.text;
  const styleSel = document.getElementById('captionStyle');
  if (styleSel) styleSel.value = state.caption.style;
  const sizeRange = document.getElementById('captionSize');
  if (sizeRange) sizeRange.value = String(Math.round(state.caption.size * 100));
  const outlineBox = document.getElementById('captionOutline');
  if (outlineBox) outlineBox.checked = state.caption.outline !== false;
  const shadowBox = document.getElementById('captionShadow');
  if (shadowBox) shadowBox.checked = state.caption.shadow !== false;
  const photoPick = document.getElementById('photoPick');
  if (photoPick) photoPick.value = state.panels[state.selected]?.photo ?? 'neon';
  const zoomRange = document.getElementById('zoomRange');
  if (zoomRange) zoomRange.value = String(state.panels[state.selected]?.zoom ?? 1);
  const panX = document.getElementById('panXRange');
  if (panX) panX.value = String(state.panels[state.selected]?.ox ?? 0);
  const panY = document.getElementById('panYRange');
  if (panY) panY.value = String(state.panels[state.selected]?.oy ?? 0);
  const chips = document.getElementById('panelChips');
  if (chips) {
    chips.innerHTML = '';
    state.panels.forEach((panel, i) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `chip${i === state.selected ? ' active' : ''}`;
      chip.textContent = `Panel ${i + 1}`;
      chip.addEventListener('click', () => { state.selected = i; syncControls(); redrawPreview(); });
      chips.appendChild(chip);
    });
  }
}

function wireControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    commitChange();
  }));
  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
    state.grade = b.dataset.grade;
    commitChange();
  }));
  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    state.size = b.dataset.size;
    commitChange();
  }));
  document.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => {
    state.caption.place = b.dataset.place;
    commitChange();
  }));
  document.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
    state.caption.color = b.dataset.color;
    commitChange();
  }));
  document.getElementById('captionText').addEventListener('input', (e) => {
    state.caption.text = e.target.value;
    saveProject();
    redrawPreview();
  });
  document.getElementById('captionText').addEventListener('change', () => pushHistory());
  document.getElementById('captionStyle').addEventListener('change', (e) => {
    state.caption.style = e.target.value;
    commitChange();
  });
  document.getElementById('captionSize').addEventListener('input', (e) => {
    state.caption.size = Number(e.target.value) / 100;
    saveProject();
    redrawPreview();
  });
  document.getElementById('captionSize').addEventListener('change', () => pushHistory());
  document.getElementById('captionOutline').addEventListener('change', (e) => {
    state.caption.outline = e.target.checked;
    commitChange();
  });
  document.getElementById('captionShadow').addEventListener('change', (e) => {
    state.caption.shadow = e.target.checked;
    commitChange();
  });
  document.getElementById('photoPick').addEventListener('change', (e) => {
    if (e.target.value === 'upload') {
      document.getElementById('photoFile').click();
      return;
    }
    state.panels[state.selected].photo = e.target.value;
    commitChange();
  });
  document.getElementById('photoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    uploads[state.selected] = url;
    state.panels[state.selected].photo = 'upload';
    state.panels[state.selected].zoom = 1;
    state.panels[state.selected].ox = 0;
    state.panels[state.selected].oy = 0;
    commitChange();
  });
  const bindSlider = (id, apply) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => { apply(Number(el.value)); saveProject(); redrawPreview(); });
    el.addEventListener('change', () => pushHistory());
  };
  bindSlider('zoomRange', (v) => { state.panels[state.selected].zoom = v; });
  bindSlider('panXRange', (v) => { state.panels[state.selected].ox = v; });
  bindSlider('panYRange', (v) => { state.panels[state.selected].oy = v; });
  document.getElementById('fillEverywhere').addEventListener('click', () => {
    const source = { ...state.panels[state.selected] };
    state.panels = state.panels.map(() => ({ ...source }));
    commitChange();
  });
  document.getElementById('resetCrop').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.zoom = 1; panel.ox = 0; panel.oy = 0;
    commitChange();
  });
  document.getElementById('undoBtn').addEventListener('click', undoProject);
  document.getElementById('redoBtn').addEventListener('click', redoProject);
  document.getElementById('resetBtn').addEventListener('click', () => {
    state = defaultState();
    uploads = {};
    commitChange();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportCover().catch(() => { statusEl.textContent = 'Export failed — try again.'; });
  });
  wireCanvasPointer();
}

/** Click a panel to select it; drag to pan its photo; scroll to zoom it. */
export function wireCanvasPointer() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const panelAt = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * (canvas.width / r.width);
    const y = (clientY - r.top) * (canvas.height / r.height);
    const rects = layoutPanels(state.layout, canvas.width, canvas.height);
    return { index: rects.findIndex((rect) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h), rects, x, y };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (hit.index < 0) return;
    state.selected = hit.index;
    syncControls();
    redrawPreview();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = canvas.getBoundingClientRect();
    const panel = state.panels[state.selected];
    panel.ox = clampNumber(panel.ox + (e.clientX - lastX) / r.width, -0.5, 0.5, 0);
    panel.oy = clampNumber(panel.oy + (e.clientY - lastY) / r.height, -0.5, 0.5, 0);
    lastX = e.clientX;
    lastY = e.clientY;
    saveProject();
    redrawPreview();
    syncControls();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging) { dragging = false; pushHistory(); }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    panel.zoom = clampNumber(panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1, 3, 1);
    saveProject();
    redrawPreview();
    syncControls();
  }, { passive: false });
}

// Fill the photo picker with the shipped samples plus the upload option.
const photoPick = document.getElementById('photoPick');
SAMPLES.forEach((s) => {
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = s.label;
  photoPick.appendChild(opt);
});
const uploadOpt = document.createElement('option');
uploadOpt.value = 'upload';
uploadOpt.textContent = 'Upload your own photo…';
photoPick.appendChild(uploadOpt);

wireControls();
syncControls();
pushHistory();
loadPhotos();
document.fonts.ready.then(() => redrawPreview());

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    setScene: async (scene) => {
      if (scene.layout) state.layout = scene.layout;
      if (scene.grade) state.grade = scene.grade;
      if (scene.size) state.size = scene.size;
      if (scene.caption) state.caption = { ...state.caption, ...scene.caption };
      if (scene.photos) {
        fitPanelsToLayout(state);
        scene.photos.forEach((id, i) => {
          if (state.panels[i]) state.panels[i].photo = id;
        });
      }
      await loadPhotos();
    },
    canvas,
    drawAt: (w, h) => {
      canvas.width = w;
      canvas.height = h;
      drawCover(ctx, state, photos, w, h);
    },
  });
}
