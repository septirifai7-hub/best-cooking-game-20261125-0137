// Ember & Thyme — Hearth Kitchen: boot and the main loop.
// One clear job: start the game, run the clock, and draw every frame.
// The rules live in logic.js, the pictures in render.js, the input in
// input.js — this file only keeps them turning.

import { CANVAS_H, CANVAS_W } from './config.js';
import { PHASE, createGame, spawnOrder } from './state.js';
import { tick } from './logic.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const game = createGame(Number(params.get('seed') || 20261125));

// A staged screenshot (?shot=...) or a normal fresh title screen.
if (params.has('shot')) {
  applyShot(game, params);
} else {
  game.phase = PHASE.TITLE;
}

bindInput(canvas, game);

// The first ticket appears a few seconds into a real shift.
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (game.phase === PHASE.PLAYING && game.orders.length === 0 && !game.frozen) {
    game.orderTimer -= dt;
    if (game.orderTimer <= 0) {
      spawnOrder(game);
      game.orderTimer = 12;
    }
  }
  tick(game, dt);
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Exposed for play-testing from the console: window.__game.
window.__game = game;
