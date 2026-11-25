// Ember & Thyme — Hearth Kitchen: tuning, recipes and layout.
// One clear job: every number, name and rectangle the game uses lives here,
// so the rest of the code reads like a recipe card, not a spreadsheet.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// A 3-minute lunch shift.
export const SHIFT_SECONDS = 180;
// How often a new ticket appears on the order board (seconds).
export const ORDER_EVERY_SECONDS = 12;
// How long a customer waits before walking out (seconds).
export const ORDER_PATIENCE_SECONDS = 48;
export const MAX_ORDERS = 4;
// Points lost for serving the wrong dish.
export const WRONG_SERVE_PENALTY = 10;
// Tip: up to this many extra coins for a fast serve.
export const MAX_TIP = 8;

// Ingredients. `prep` says what the kitchen must do before the ingredient
// can go on a plate: none (straight from the bin), grill or chop.
export const INGREDIENTS = [
  { id: 'bun',     name: 'Bun',     key: '1', color: '#e8b06a', dark: '#b97f3a', prep: 'none',  emoji: '🥖' },
  { id: 'patty',   name: 'Patty',   key: '2', color: '#a85b3f', dark: '#7a3d28', prep: 'grill', emoji: '🥩' },
  { id: 'lettuce', name: 'Lettuce', key: '3', color: '#7dc383', dark: '#4d8f55', prep: 'chop',  emoji: '🥬' },
  { id: 'tomato',  name: 'Tomato',  key: '4', color: '#e05a4e', dark: '#a83a32', prep: 'chop',  emoji: '🍅' },
  { id: 'cheese',  name: 'Cheese',  key: '5', color: '#f2c94c', dark: '#c79a1d', prep: 'none',  emoji: '🧀' },
  { id: 'sauce',   name: 'Sauce',   key: '6', color: '#d98a2b', dark: '#9c5f14', prep: 'none',  emoji: '🍯' },
];

export const ingredientById = (id) => INGREDIENTS.find((i) => i.id === id);

// The menu: original dishes, each a set of ingredients in any order.
export const RECIPES = [
  { id: 'sunny-bunwich', name: 'Sunny Bunwich',  needs: ['bun', 'patty', 'lettuce'],                 price: 12 },
  { id: 'ember-melt',    name: 'Ember Melt',     needs: ['bun', 'patty', 'cheese', 'sauce'],        price: 16 },
  { id: 'garden-stack',  name: 'Garden Stack',   needs: ['bun', 'lettuce', 'tomato', 'cheese'],     price: 14 },
  { id: 'golden-crisp',  name: 'Golden Crisp',   needs: ['bun', 'patty', 'tomato', 'sauce'],        price: 15 },
  { id: 'thyme-special', name: 'Thyme Special',  needs: ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'sauce'], price: 22 },
];

export const recipeById = (id) => RECIPES.find((r) => r.id === id);

// Seconds on each station. A patty left too long on the grill burns.
export const GRILL_SECONDS = 6;
export const GRILL_BURN_AFTER = 11;
export const CHOP_SECONDS = 3;

// Every rectangle the kitchen is drawn in, and clicked in.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 76, w: 392, h: 232 },
  boardTitle: { x: 24, y: 76, w: 392, h: 30 },
  ticket: { w: 392, h: 40, gap: 6 },
  // The kitchen floor: grill, chopping board, ingredient counter.
  floor: { x: 24, y: 320, w: 1232, h: 300 },
  grill: { x: 48, y: 372, w: 260, h: 190 },
  grillSlot: { w: 112, h: 96, gap: 16 },
  board2: { x: 348, y: 372, w: 260, h: 190 },
  boardSlot: { w: 112, h: 96, gap: 16 },
  counter: { x: 648, y: 372, w: 584, h: 190 },
  bin: { w: 88, h: 140, gap: 9 },
  // The plating bench along the bottom.
  bench: { x: 24, y: 640, w: 1232, h: 136 },
  plate: { x: 48, y: 668, w: 470, h: 92 },
  plateSlot: { w: 64, h: 64, gap: 10 },
  serve: { x: 560, y: 668, w: 170, h: 92 },
  trash: { x: 746, y: 668, w: 110, h: 92 },
  hint: { x: 900, y: 668, w: 356, h: 92 },
};
