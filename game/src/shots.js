// Ember & Thyme — Hearth Kitchen: staged scenes for screenshots.
// One clear job: read ?shot=<name>&seed=<n> from the URL and arrange a real,
// playable game state for that shot, then freeze the clock so the picture is
// stable. Nothing here is fake: every pixel is the game's own renderer
// drawing its own state, and the game can be played on from any shot.
//
//   ?shot=start     the title screen over an empty kitchen
//   ?shot=play      mid-shift: orders on the board, grill and board busy
//   ?shot=assembly  a dish half-built on the plate
//   ?shot=serve     a finished plate, glowing, ready to serve

import { PHASE, createGame, spawnOrder } from './state.js';
import { recipeById } from './config.js';

function freeze(game, timeLeft) {
  game.frozen = true;
  game.timeLeft = timeLeft;
  game.phase = PHASE.PLAYING;
}

export function applyShot(game, params) {
  const shot = params.get('shot') || 'play';
  const seed = Number(params.get('seed') || 7);

  if (shot === 'start') {
    const fresh = createGame(seed);
    Object.assign(game, fresh);
    game.phase = PHASE.TITLE;
    return;
  }

  if (shot === 'play') {
    const fresh = createGame(seed);
    Object.assign(game, fresh);
    spawnOrder(game);
    spawnOrder(game);
    spawnOrder(game);
    game.grill[0] = { ingredient: 'patty', progress: 3.5, done: false, burnt: false };
    game.board[0] = { ingredient: 'tomato', progress: 1.5, done: false };
    game.score = 42;
    game.coins = 42;
    game.served = 3;
    freeze(game, 151);
    return;
  }

  if (shot === 'assembly') {
    const fresh = createGame(seed);
    Object.assign(game, fresh);
    spawnOrder(game);
    spawnOrder(game);
    // A Sunny Bunwich half-built: bun and grilled patty on the plate,
    // lettuce still being chopped.
    game.plate = ['bun', 'patty'];
    game.board[0] = { ingredient: 'lettuce', progress: 2.2, done: false };
    game.grill[0] = { ingredient: 'patty', progress: 5.2, done: false, burnt: false };
    game.score = 28;
    game.coins = 28;
    game.served = 2;
    freeze(game, 107);
    return;
  }

  if (shot === 'serve') {
    const fresh = createGame(seed);
    Object.assign(game, fresh);
    spawnOrder(game);
    spawnOrder(game);
    spawnOrder(game);
    // Build a complete dish that matches the first order on the board.
    const first = game.orders[0];
    const recipe = recipeById(first.recipeId);
    game.plate = [...recipe.needs];
    game.grill[0] = { ingredient: 'patty', progress: 6.5, done: true, burnt: false };
    game.score = 96;
    game.coins = 96;
    game.served = 6;
    game.combo = 3;
    game.bestCombo = 3;
    freeze(game, 72);
    return;
  }

  // Unknown shot: just play.
  const fresh = createGame(seed);
  Object.assign(game, fresh);
  spawnOrder(game);
  freeze(game, 150);
}
