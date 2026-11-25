// Ember & Thyme — Hearth Kitchen: everything the player sees.
// One clear job: draw the kitchen on the canvas — header, order board,
// grill, chopping board, ingredient counter, plate bench, and the title and
// results screens. It reads state, it never changes it.

import {
  CANVAS_H,
  CANVAS_W,
  GRILL_BURN_AFTER,
  GRILL_SECONDS,
  CHOP_SECONDS,
  INGREDIENTS,
  LAYOUT,
  RECIPES,
  ingredientById,
  recipeById,
} from './config.js';
import { PHASE } from './state.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// ---- clickable geometry, shared with input.js ---------------------------
export function regions() {
  const r = {};
  r.bins = INGREDIENTS.map((ing, i) => ({
    id: ing.id,
    x: LAYOUT.counter.x + 16 + i * (LAYOUT.bin.w + LAYOUT.bin.gap),
    y: LAYOUT.counter.y + 34,
    w: LAYOUT.bin.w,
    h: LAYOUT.bin.h,
  }));
  r.grillSlots = [0, 1].map((i) => ({
    x: LAYOUT.grill.x + 14 + i * (LAYOUT.grillSlot.w + LAYOUT.grillSlot.gap),
    y: LAYOUT.grill.y + 40,
    w: LAYOUT.grillSlot.w,
    h: LAYOUT.grillSlot.h,
  }));
  r.boardSlots = [0, 1].map((i) => ({
    x: LAYOUT.board2.x + 14 + i * (LAYOUT.boardSlot.w + LAYOUT.boardSlot.gap),
    y: LAYOUT.board2.y + 40,
    w: LAYOUT.boardSlot.w,
    h: LAYOUT.boardSlot.h,
  }));
  r.serve = { ...LAYOUT.serve };
  r.trash = { ...LAYOUT.trash };
  r.start = { x: CANVAS_W / 2 - 190, y: 560, w: 380, h: 72 };
  r.restart = { x: CANVAS_W / 2 - 190, y: 560, w: 380, h: 72 };
  return r;
}

function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
export function hitAt(x, y) {
  const r = regions();
  for (const b of r.bins) if (inside(x, y, b)) return { kind: 'bin', id: b.id };
  for (let i = 0; i < 2; i++) if (inside(x, y, r.grillSlots[i])) return { kind: 'grill', slot: i };
  for (let i = 0; i < 2; i++) if (inside(x, y, r.boardSlots[i])) return { kind: 'board', slot: i };
  if (inside(x, y, r.serve)) return { kind: 'serve' };
  if (inside(x, y, r.trash)) return { kind: 'trash' };
  return null;
}

// ---- small drawing helpers ----------------------------------------------
function rr(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 600, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function panel(ctx, x, y, w, h, fill, stroke = 'rgba(0,0,0,0.18)') {
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function progressBar(ctx, x, y, w, h, frac, color) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  if (frac > 0) {
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// ---- original vector food icons (no emoji, no image files) ---------------
export function drawIngredient(ctx, id, cx, cy, s) {
  const ing = ingredientById(id);
  const u = s / 2; // half-size unit
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  if (id === 'bun') {
    ctx.fillStyle = '#e8b06a';
    ctx.beginPath();
    ctx.arc(0, u * 0.15, u * 0.85, Math.PI, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c98d4a';
    ctx.fillRect(-u * 0.85, u * 0.15, u * 1.7, u * 0.28);
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.4, -0.35], [0.05, -0.55], [0.42, -0.3]]) {
      ctx.beginPath(); ctx.ellipse(sx * u, sy * u, u * 0.1, u * 0.06, 0.3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = '#8a4a30';
    rr(ctx, -u * 0.9, -u * 0.45, u * 1.8, u * 0.9, u * 0.4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6d3620';
    for (const [sx, sy] of [[-0.5, -0.1], [0.1, 0.15], [0.5, -0.15]]) {
      ctx.beginPath(); ctx.arc(sx * u, sy * u, u * 0.09, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#7dc383';
    ctx.beginPath();
    ctx.moveTo(-u * 0.9, u * 0.2);
    for (let i = 0; i <= 6; i++) {
      const x = -u * 0.9 + (i * u * 1.8) / 6;
      ctx.quadraticCurveTo(x + u * 0.15, u * (i % 2 ? 0.75 : -0.55), x + u * 0.3, u * 0.2);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4d8f55';
    ctx.beginPath(); ctx.moveTo(-u * 0.7, u * 0.2); ctx.lineTo(u * 0.7, u * 0.2); ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e05a4e';
    ctx.beginPath(); ctx.arc(0, u * 0.1, u * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4d8f55';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.lineTo(Math.cos(a) * u * 0.35, -u * 0.55 + Math.sin(a) * u * 0.3);
      const a2 = a + Math.PI / 5;
      ctx.lineTo(Math.cos(a2) * u * 0.14, -u * 0.55 + Math.sin(a2) * u * 0.14);
    }
    ctx.closePath(); ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(-u * 0.85, u * 0.45); ctx.lineTo(u * 0.85, u * 0.45); ctx.lineTo(u * 0.85, -u * 0.1);
    ctx.lineTo(-u * 0.2, -u * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c79a1d';
    for (const [sx, sy] of [[0.1, 0.05], [0.5, 0.2], [-0.35, 0.15]]) {
      ctx.beginPath(); ctx.arc(sx * u, sy * u, u * 0.11, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'sauce') {
    ctx.fillStyle = '#d98a2b';
    ctx.beginPath();
    ctx.moveTo(0, -u * 0.8);
    ctx.bezierCurveTo(u * 0.75, -u * 0.1, u * 0.7, u * 0.55, 0, u * 0.75);
    ctx.bezierCurveTo(-u * 0.7, u * 0.55, -u * 0.75, -u * 0.1, 0, -u * 0.8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f7c873';
    ctx.beginPath(); ctx.ellipse(-u * 0.22, -u * 0.1, u * 0.13, u * 0.28, 0.25, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  return ing;
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- the whole kitchen ----------------------------------------------------
export function render(ctx, game) {
  // Wall and floor.
  ctx.fillStyle = '#f3e3c8';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#e9d3ae';
  for (let y = 320; y < CANVAS_H; y += 46) {
    ctx.fillRect(0, y, CANVAS_W, 2);
  }
  ctx.fillStyle = '#d9b98a';
  ctx.fillRect(0, 312, CANVAS_W, 8);

  renderHeader(ctx, game);
  renderBoard(ctx, game);
  renderMenu(ctx, game);
  renderStations(ctx, game);
  renderBench(ctx, game);
  renderToasts(ctx, game);

  if (game.phase === PHASE.TITLE) renderTitle(ctx, game);
  if (game.phase === PHASE.PAUSED) renderPaused(ctx);
  if (game.phase === PHASE.DONE) renderDone(ctx, game);
}

function renderHeader(ctx, game) {
  const h = LAYOUT.header;
  ctx.fillStyle = '#5b3a29';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = '#7a4a34';
  ctx.fillRect(h.x, h.y + h.h - 6, h.w, 6);
  text(ctx, 'EMBER & THYME', 24, 40, 26, '#ffd98a', 800);
  text(ctx, 'HEARTH KITCHEN', 250, 40, 15, '#e8c9a0', 600);

  // The shift timer: big, central, impossible to miss.
  const urgent = game.timeLeft <= 30 && game.phase === PHASE.PLAYING;
  const tc = urgent ? '#ff6b5e' : '#ffffff';
  text(ctx, '⏱ SHIFT', CANVAS_W / 2 - 130, 26, 13, '#e8c9a0', 700, 'left');
  text(ctx, fmtTime(game.timeLeft), CANVAS_W / 2 - 60, 46, 34, tc, 800);
  text(ctx, urgent ? 'RUSH!' : 'lunch shift', CANVAS_W / 2 + 52, 40, 14, urgent ? '#ff6b5e' : '#e8c9a0', 700);

  text(ctx, `SCORE  ${game.score}`, 940, 28, 17, '#ffffff', 800, 'left');
  text(ctx, `COINS  ${game.coins}¢`, 940, 50, 15, '#ffd98a', 700, 'left');
  text(ctx, game.combo > 1 ? `COMBO x${game.combo}` : '', 1150, 40, 16, '#8fe388', 800, 'right');
}

function renderBoard(ctx, game) {
  const b = LAYOUT.board;
  // Cork order board.
  panel(ctx, b.x, b.y, b.w, b.h, '#c89b6a', '#8a5f36');
  ctx.fillStyle = '#8a5f36';
  ctx.fillRect(b.x, b.y, b.w, 30);
  text(ctx, 'ORDER BOARD', b.x + 14, b.y + 21, 14, '#ffe9bd', 800);
  text(ctx, `${game.orders.length}/${4} tickets`, b.x + b.w - 14, b.y + 21, 12, '#ffe9bd', 600, 'right');

  if (game.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush', b.x + 16, b.y + 70, 15, '#5b3a29', 600);
    text(ctx, 'is coming. Get the grill hot!', b.x + 16, b.y + 92, 15, '#5b3a29', 600);
  }
  game.orders.forEach((order, i) => {
    const y = b.y + 36 + i * (LAYOUT.ticket.h + LAYOUT.ticket.gap);
    const x = b.x + 8;
    const w = b.w - 16;
    const h = LAYOUT.ticket.h;
    const frac = Math.max(0, order.patience / order.maxPatience);
    panel(ctx, x, y, w, h, '#fff8ea', frac < 0.3 ? '#d94f3d' : 'rgba(0,0,0,0.15)');
    // Patience bar along the bottom of the ticket.
    progressBar(ctx, x + 2, y + h - 6, w - 4, 5, frac, frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#f2c94c' : '#e05a4e');
    text(ctx, order.name, x + 10, y + 19, 15, '#3a2a1c', 800);
    text(ctx, `${order.price}¢`, x + w - 10, y + 19, 14, '#7a4a34', 800, 'right');
    // Ingredient chips sit right of the name, clear of it.
    const chipX = x + 178;
    order.needs.forEach((id, j) => {
      drawIngredient(ctx, id, chipX + j * 30, y + 20, 24);
    });
  });
  // Footer: when the next ticket arrives, and the house tip rule.
  text(ctx, `Next ticket in ${Math.max(0, Math.ceil(game.orderTimer))}s  ·  Fast serves earn up to +8¢ tip`, b.x + 14, b.y + b.h - 8, 12, '#5b3a29', 600);
}

// Today's menu: every dish on offer, so the player can plan a route
// through the kitchen before the tickets land.
function renderMenu(ctx, game) {
  const x = 440, y = 76, w = 816, h = 232;
  panel(ctx, x, y, w, h, '#fff8ea', '#8a5f36');
  ctx.fillStyle = '#5b3a29';
  ctx.fillRect(x, y, w, 30);
  text(ctx, "TODAY'S MENU — five dishes, one hot grill", x + 14, y + 21, 14, '#ffe9bd', 800);
  text(ctx, 'grill the patty · chop the veg · stack the plate', x + w - 14, y + 21, 12, '#ffe9bd', 600, 'right');
  RECIPES.forEach((recipe, i) => {
    const ry = y + 42 + i * 37;
    text(ctx, recipe.name, x + 16, ry + 15, 16, '#3a2a1c', 800);
    recipe.needs.forEach((id, j) => {
      drawIngredient(ctx, id, x + 240 + j * 32, ry + 12, 24);
    });
    text(ctx, `${recipe.price}¢`, x + w - 16, ry + 15, 15, '#7a4a34', 800, 'right');
    if (i < RECIPES.length - 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 14, ry + 28); ctx.lineTo(x + w - 14, ry + 28); ctx.stroke();
    }
  });
}

function stationSlot(ctx, x, y, w, h, label, item, progressFrac, state) {
  panel(ctx, x, y, w, h, '#2e2a26', 'rgba(0,0,0,0.3)');
  if (!item) {
    text(ctx, label, x + w / 2, y + h / 2 - 4, 13, '#8d8578', 600, 'center');
    text(ctx, 'empty', x + w / 2, y + h / 2 + 16, 12, '#6d6558', 600, 'center');
    return;
  }
  drawIngredient(ctx, item.ingredient, x + w / 2, y + h / 2 - 8, 52);
  progressBar(ctx, x + 10, y + h - 26, w - 20, 8, progressFrac, state === 'burnt' ? '#e05a4e' : state === 'done' ? '#7dc383' : '#f2c94c');
  const note = state === 'burnt' ? 'BURNT — click to toss' : state === 'done' ? 'READY! Click to take' : state;
  text(ctx, note, x + w / 2, y + h - 8, 11, state === 'done' ? '#8fe388' : state === 'burnt' ? '#ff9a8a' : '#d8cfc0', 700, 'center');
}

function renderStations(ctx, game) {
  const f = LAYOUT.floor;
  text(ctx, 'THE KITCHEN', f.x + 4, f.y + 22, 15, '#7a5a38', 800);
  text(ctx, 'Click a bin, grill the patty, chop the veg, build the plate, serve!', f.x + 150, f.y + 22, 13, '#9a7a52', 600);

  // Grill.
  const g = LAYOUT.grill;
  panel(ctx, g.x, g.y, g.w, g.h, '#4a3b32', '#332820');
  text(ctx, '🔥 GRILL', g.x + 14, g.y + 26, 15, '#ffb37a', 800);
  text(ctx, 'patties cook here', g.x + 96, g.y + 25, 12, '#c9a98e', 600);
  const gr = regions().grillSlots;
  game.grill.forEach((item, i) => {
    const frac = item ? Math.min(1, item.progress / GRILL_SECONDS) : 0;
    const state = !item ? '' : item.burnt ? 'burnt' : item.done ? 'done' : 'cooking…';
    stationSlot(ctx, gr[i].x, gr[i].y, gr[i].w, gr[i].h, 'grill slot', item, frac, state);
  });

  // Chopping board.
  const bd = LAYOUT.board2;
  panel(ctx, bd.x, bd.y, bd.w, bd.h, '#a9805a', '#7a5a38');
  text(ctx, '🔪 CHOPPING BOARD', bd.x + 14, bd.y + 26, 15, '#fff3d6', 800);
  const bs = regions().boardSlots;
  game.board.forEach((item, i) => {
    const frac = item ? Math.min(1, item.progress / CHOP_SECONDS) : 0;
    const state = !item ? '' : item.done ? 'done' : 'chopping…';
    stationSlot(ctx, bs[i].x, bs[i].y, bs[i].w, bs[i].h, 'board slot', item, frac, state);
  });

  // Ingredient counter.
  const c = LAYOUT.counter;
  panel(ctx, c.x, c.y, c.w, c.h, '#8a5f36', '#6d4525');
  text(ctx, 'INGREDIENTS — on the counter', c.x + 14, c.y + 26, 15, '#ffe9bd', 800);
  const bins = regions().bins;
  INGREDIENTS.forEach((ing, i) => {
    const b = bins[i];
    panel(ctx, b.x, b.y, b.w, b.h, '#fff8ea', 'rgba(0,0,0,0.15)');
    drawIngredient(ctx, ing.id, b.x + b.w / 2, b.y + 52, 56);
    text(ctx, ing.name, b.x + b.w / 2, b.y + 100, 14, '#3a2a1c', 700, 'center');
    text(ctx, ing.prep === 'none' ? 'ready' : ing.prep === 'grill' ? 'needs grill' : 'needs chop', b.x + b.w / 2, b.y + 118, 11, '#9a7a52', 600, 'center');
    // Key badge.
    ctx.fillStyle = '#5b3a29';
    ctx.beginPath(); ctx.arc(b.x + b.w - 14, b.y + 14, 11, 0, Math.PI * 2); ctx.fill();
    text(ctx, ing.key, b.x + b.w - 14, b.y + 18, 12, '#ffd98a', 800, 'center');
  });
}

function renderBench(ctx, game) {
  const b = LAYOUT.bench;
  panel(ctx, b.x, b.y, b.w, b.h, '#6d4525', '#54341c');
  text(ctx, 'YOUR PLATE', LAYOUT.plate.x + 4, LAYOUT.plate.y - 8, 14, '#ffe9bd', 800);

  // Plate slots.
  const p = LAYOUT.plate;
  panel(ctx, p.x, p.y, p.w, p.h, '#f6ead2', '#d9c39a');
  for (let i = 0; i < 6; i++) {
    const x = p.x + 14 + i * (LAYOUT.plateSlot.w + LAYOUT.plateSlot.gap);
    const y = p.y + 14;
    rr(ctx, x, y, LAYOUT.plateSlot.w, LAYOUT.plateSlot.h, 10);
    ctx.fillStyle = i < game.plate.length ? '#fff8ea' : 'rgba(0,0,0,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.stroke();
    if (i < game.plate.length) drawIngredient(ctx, game.plate[i], x + 32, y + 32, 48);
  }
  // Name the dish being built when it matches a recipe.
  const built = game.plate.length ? recipeById(game.orders.find((o) => o.needs.length === game.plate.length && o.needs.every((n) => game.plate.includes(n)))?.recipeId) : null;

  // Serve button: glows green when the plate matches an order.
  const s = LAYOUT.serve;
  const match = game.plate.length > 0 && game.orders.some((o) => o.needs.length === game.plate.length && o.needs.every((n) => game.plate.includes(n)));
  panel(ctx, s.x, s.y, s.w, s.h, match ? '#4d8f55' : '#7a8a6d', match ? '#2f6b38' : '#5a6a52');
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + 42, 26, '#ffffff', 800, 'center');
  text(ctx, match ? '✓ plate ready!' : 'Space', s.x + s.w / 2, s.y + 68, 13, match ? '#d8ffd8' : '#e8e2d2', 700, 'center');

  const t = LAYOUT.trash;
  panel(ctx, t.x, t.y, t.w, t.h, '#8a4a3a', '#6d362a');
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + 42, 18, '#ffffff', 800, 'center');
  text(ctx, 'key T', t.x + t.w / 2, t.y + 68, 13, '#e8c9b8', 700, 'center');

  const h = LAYOUT.hint;
  text(ctx, 'Keys: 1–6 ingredients · Space serve', h.x + 4, h.y + 24, 13, '#ffe9bd', 600);
  text(ctx, 'T trash · P pause · M mute', h.x + 4, h.y + 46, 13, '#ffe9bd', 600);
  text(ctx, `Served ${game.served} · Walked out ${game.lost}`, h.x + 4, h.y + 68, 13, '#ffe9bd', 600);
  if (built) text(ctx, `That is a ${built.name}!`, h.x + 4, h.y + 88, 13, '#8fe388', 800);
}

function renderToasts(ctx, game) {
  game.toasts.forEach((t, i) => {
    ctx.globalAlpha = Math.min(1, t.life);
    const w = 340;
    panel(ctx, CANVAS_W / 2 - w / 2, 84 + i * 34, w, 28, t.good ? 'rgba(61,90,61,0.92)' : 'rgba(120,52,40,0.92)');
    text(ctx, t.text, CANVAS_W / 2, 84 + i * 34 + 19, 14, '#ffffff', 700, 'center');
    ctx.globalAlpha = 1;
  });
}

function renderTitle(ctx, game) {
  ctx.fillStyle = 'rgba(43,26,16,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  panel(ctx, CANVAS_W / 2 - 360, 120, 720, 440, '#fff8ea', '#8a5f36');
  text(ctx, 'EMBER & THYME', CANVAS_W / 2, 190, 52, '#5b3a29', 800, 'center');
  text(ctx, '— HEARTH KITCHEN —', CANVAS_W / 2, 224, 20, '#b97f3a', 700, 'center');
  text(ctx, 'A cozy cooking game. Orders land on the board,', CANVAS_W / 2, 280, 17, '#3a2a1c', 600, 'center');
  text(ctx, 'you grill, chop and stack each dish, then serve it', CANVAS_W / 2, 306, 17, '#3a2a1c', 600, 'center');
  text(ctx, 'before the customer walks out. Three minutes,', CANVAS_W / 2, 332, 17, '#3a2a1c', 600, 'center');
  text(ctx, 'one very hot kitchen.', CANVAS_W / 2, 358, 17, '#3a2a1c', 600, 'center');
  text(ctx, '1–6 pick ingredients · click the grill & board · Space serves', CANVAS_W / 2, 410, 15, '#7a5a38', 700, 'center');
  text(ctx, 'Fast serves earn tips. Wrong plates cost 10 points.', CANVAS_W / 2, 436, 15, '#7a5a38', 700, 'center');
  const r = regions().start;
  panel(ctx, r.x, r.y, r.w, r.h, '#4d8f55', '#2f6b38');
  text(ctx, '▶  START THE SHIFT', CANVAS_W / 2, r.y + 46, 24, '#ffffff', 800, 'center');
  text(ctx, 'or press Enter', CANVAS_W / 2, r.y + r.h + 26, 13, '#ffe9bd', 600, 'center');
}

function renderPaused(ctx) {
  ctx.fillStyle = 'rgba(43,26,16,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 10, 48, '#ffffff', 800, 'center');
  text(ctx, 'Press P to keep cooking', CANVAS_W / 2, CANVAS_H / 2 + 30, 18, '#ffe9bd', 600, 'center');
}

function renderDone(ctx, game) {
  ctx.fillStyle = 'rgba(43,26,16,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  panel(ctx, CANVAS_W / 2 - 330, 150, 660, 400, '#fff8ea', '#8a5f36');
  text(ctx, 'SHIFT OVER!', CANVAS_W / 2, 220, 44, '#5b3a29', 800, 'center');
  text(ctx, `Final score: ${game.score}`, CANVAS_W / 2, 285, 26, '#3a2a1c', 800, 'center');
  text(ctx, `Dishes served: ${game.served}   ·   Coins earned: ${game.coins}¢`, CANVAS_W / 2, 325, 17, '#3a2a1c', 600, 'center');
  text(ctx, `Best combo: x${Math.max(1, game.bestCombo)}   ·   Customers lost: ${game.lost}`, CANVAS_W / 2, 353, 17, '#3a2a1c', 600, 'center');
  const verdict = game.score >= 150 ? 'A legendary lunch service!' : game.score >= 90 ? 'A fine service — the regulars approve.' : game.score >= 40 ? 'A decent shift. The grill forgives.' : 'A quiet shift. The kitchen will be ready next time.';
  text(ctx, verdict, CANVAS_W / 2, 395, 16, '#7a5a38', 700, 'center');
  const r = regions().restart;
  panel(ctx, r.x, r.y, r.w, r.h, '#4d8f55', '#2f6b38');
  text(ctx, '↻  COOK AGAIN', CANVAS_W / 2, r.y + 46, 24, '#ffffff', 800, 'center');
  text(ctx, 'or press R', CANVAS_W / 2, r.y + r.h + 26, 13, '#ffe9bd', 600, 'center');
}
