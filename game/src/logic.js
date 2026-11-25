// Ember & Thyme — Hearth Kitchen: the rules of the kitchen.
// One clear job: adding ingredients, grilling, chopping, serving, scoring
// and the shift clock. The renderer only reads what this module changes.

import {
  CHOP_SECONDS,
  GRILL_BURN_AFTER,
  GRILL_SECONDS,
  MAX_TIP,
  ORDER_EVERY_SECONDS,
  WRONG_SERVE_PENALTY,
  ingredientById,
  recipeById,
} from './config.js';
import { PHASE, spawnOrder } from './state.js';
import { sfx } from './audio.js';

function toast(game, text, good = true) {
  game.toasts.push({ text, good, life: 1.6 });
  if (game.toasts.length > 4) game.toasts.shift();
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

// Click (or press 1-6) on an ingredient bin.
export function addIngredient(game, id) {
  if (game.phase !== PHASE.PLAYING) return;
  const ing = ingredientById(id);
  if (!ing) return;
  if (ing.prep === 'grill') {
    const slot = game.grill.indexOf(null);
    if (slot === -1) { toast(game, 'Grill is full!', false); sfx.error(); return; }
    game.grill[slot] = { ingredient: id, progress: 0, done: false, burnt: false };
    sfx.sizzle();
    toast(game, `Patty on the grill…`);
    return;
  }
  if (ing.prep === 'chop') {
    const slot = game.board.indexOf(null);
    if (slot === -1) { toast(game, 'Chopping board is full!', false); sfx.error(); return; }
    game.board[slot] = { ingredient: id, progress: 0, done: false };
    sfx.chop();
    toast(game, `Chopping ${ing.name.toLowerCase()}…`);
    return;
  }
  if (game.plate.length >= 6) { toast(game, 'Plate is full!', false); sfx.error(); return; }
  game.plate.push(id);
  sfx.pick();
}

// Take a finished item off a station and put it on the plate.
export function takeFromGrill(game, slot) {
  if (game.phase !== PHASE.PLAYING) return;
  const item = game.grill[slot];
  if (!item) return;
  if (item.burnt) {
    game.grill[slot] = null;
    toast(game, 'Burnt patty tossed!', false);
    sfx.error();
    return;
  }
  if (!item.done) { toast(game, 'Still cooking…', false); sfx.error(); return; }
  if (game.plate.length >= 6) { toast(game, 'Plate is full!', false); sfx.error(); return; }
  game.plate.push(item.ingredient);
  game.grill[slot] = null;
  sfx.pick();
}

export function takeFromBoard(game, slot) {
  if (game.phase !== PHASE.PLAYING) return;
  const item = game.board[slot];
  if (!item) return;
  if (!item.done) { toast(game, 'Still chopping…', false); sfx.error(); return; }
  if (game.plate.length >= 6) { toast(game, 'Plate is full!', false); sfx.error(); return; }
  game.plate.push(item.ingredient);
  game.board[slot] = null;
  sfx.pick();
}

export function trashPlate(game) {
  if (game.phase !== PHASE.PLAYING) return;
  if (game.plate.length === 0) return;
  game.plate = [];
  game.combo = 0;
  toast(game, 'Plate cleared.', false);
  sfx.error();
}

// Serve the plate to the first order it matches. Returns true on a serve.
export function servePlate(game) {
  if (game.phase !== PHASE.PLAYING) return false;
  if (game.plate.length === 0) { toast(game, 'Plate is empty!', false); sfx.error(); return false; }
  const matchIndex = game.orders.findIndex((o) => sameSet(game.plate, o.needs));
  if (matchIndex === -1) {
    game.score = Math.max(0, game.score - WRONG_SERVE_PENALTY);
    game.combo = 0;
    toast(game, `No order wants that — -${WRONG_SERVE_PENALTY}`, false);
    sfx.error();
    return false;
  }
  const order = game.orders[matchIndex];
  const tip = Math.round((order.patience / order.maxPatience) * MAX_TIP);
  const comboBonus = Math.min(game.combo, 5);
  const earned = order.price + tip + comboBonus;
  game.score += earned;
  game.coins += earned;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.served += 1;
  game.orders.splice(matchIndex, 1);
  game.plate = [];
  const recipe = recipeById(order.recipeId);
  toast(game, `+${earned}  ${recipe.name} served!${game.combo > 1 ? `  Combo x${game.combo}` : ''}`);
  game.flash = { kind: 'serve', at: performance.now() };
  sfx.serve();
  return true;
}

// Advance the clock: stations, orders, toasts, and the shift timer.
export function tick(game, dt) {
  if (game.phase !== PHASE.PLAYING || game.frozen) return;
  game.elapsed += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 10.5 && game.timeLeft > 0 && Math.floor(game.timeLeft) !== Math.floor(game.timeLeft + dt)) {
    sfx.tick();
  }
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.phase = PHASE.DONE;
    sfx.end();
    return;
  }
  game.orderTimer -= dt;
  if (game.orderTimer <= 0) {
    spawnOrder(game);
    game.orderTimer = ORDER_EVERY_SECONDS;
  }
  for (const order of game.orders) order.patience -= dt;
  const walked = game.orders.filter((o) => o.patience <= 0);
  if (walked.length) {
    game.orders = game.orders.filter((o) => o.patience > 0);
    game.lost += walked.length;
    game.combo = 0;
    toast(game, `${walked.length === 1 ? 'A customer' : `${walked.length} customers`} walked out!`, false);
    sfx.lost();
  }
  for (const slot of game.grill) {
    if (!slot) continue;
    slot.progress += dt;
    if (!slot.done && slot.progress >= GRILL_SECONDS) { slot.done = true; sfx.ready(); }
    if (!slot.burnt && slot.progress >= GRILL_BURN_AFTER) { slot.burnt = true; toast(game, 'Patty burnt!', false); }
  }
  for (const slot of game.board) {
    if (!slot) continue;
    slot.progress += dt;
    if (!slot.done && slot.progress >= CHOP_SECONDS) { slot.done = true; sfx.ready(); }
  }
  for (const t of game.toasts) t.life -= dt;
  game.toasts = game.toasts.filter((t) => t.life > 0);
}
