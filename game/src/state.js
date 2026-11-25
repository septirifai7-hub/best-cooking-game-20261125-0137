// Ember & Thyme — Hearth Kitchen: the game state.
// One clear job: build a fresh shift, spawn customer orders, and hold every
// number the renderer and the rules read. No drawing and no input here.

import {
  GRILL_SECONDS,
  MAX_ORDERS,
  ORDER_PATIENCE_SECONDS,
  RECIPES,
  SHIFT_SECONDS,
} from './config.js';
import { makeRandom } from './random.js';

export const PHASE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DONE: 'done',
};

let orderCounter = 0;

export function createGame(seed = 20261125) {
  return {
    seed,
    rng: makeRandom(seed),
    phase: PHASE.TITLE,
    // Seconds left in the lunch shift.
    timeLeft: SHIFT_SECONDS,
    orderTimer: 4,
    orders: [],
    // The plate being built: ingredient ids in the order they were added.
    plate: [],
    // Grill slots: null or { ingredient, progress, done, burnt }.
    grill: [null, null],
    // Chopping-board slots: null or { ingredient, progress, done }.
    board: [null, null],
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    // Toast messages shown over the kitchen ("+18  Ember Melt!").
    toasts: [],
    // Last action flash, for the renderer: { kind, at }.
    flash: null,
    muted: false,
    // Frozen for staged screenshots: the timer does not run.
    frozen: false,
    elapsed: 0,
  };
}

export function spawnOrder(game) {
  if (game.orders.length >= MAX_ORDERS) return null;
  const recipe = game.rng.pick(RECIPES);
  orderCounter += 1;
  const order = {
    id: orderCounter,
    recipeId: recipe.id,
    name: recipe.name,
    needs: [...recipe.needs],
    price: recipe.price,
    patience: ORDER_PATIENCE_SECONDS,
    maxPatience: ORDER_PATIENCE_SECONDS,
  };
  game.orders.push(order);
  return order;
}

export function resetGame(game, seed) {
  const fresh = createGame(seed ?? game.seed);
  Object.assign(game, fresh);
}

export { GRILL_SECONDS };
