// Ember & Thyme — Hearth Kitchen: keyboard and mouse.
// One clear job: turn clicks and key presses into kitchen actions.
// It never draws and never changes a rule — it only calls logic.js.

import { INGREDIENTS } from './config.js';
import { PHASE, resetGame } from './state.js';
import {
  addIngredient,
  servePlate,
  takeFromBoard,
  takeFromGrill,
  trashPlate,
} from './logic.js';
import { hitAt, regions } from './render.js';
import { setMuted, sfx, unlockAudio } from './audio.js';

export function bindInput(canvas, game) {
  const toGameCoords = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio();
    const { x, y } = toGameCoords(event);
    if (game.phase === PHASE.TITLE) {
      const r = regions().start;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) startShift(game);
      return;
    }
    if (game.phase === PHASE.DONE) {
      const r = regions().restart;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) restartShift(game);
      return;
    }
    if (game.phase !== PHASE.PLAYING) return;
    const hit = hitAt(x, y);
    if (!hit) return;
    if (hit.kind === 'bin') addIngredient(game, hit.id);
    if (hit.kind === 'grill') takeFromGrill(game, hit.slot);
    if (hit.kind === 'board') takeFromBoard(game, hit.slot);
    if (hit.kind === 'serve') servePlate(game);
    if (hit.kind === 'trash') trashPlate(game);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (game.phase === PHASE.TITLE && (key === 'enter' || key === ' ')) {
      unlockAudio();
      startShift(game);
      return;
    }
    if (game.phase === PHASE.DONE && key === 'r') {
      restartShift(game);
      return;
    }
    if (key === 'p' && (game.phase === PHASE.PLAYING || game.phase === PHASE.PAUSED)) {
      game.phase = game.phase === PHASE.PLAYING ? PHASE.PAUSED : PHASE.PLAYING;
      return;
    }
    if (key === 'm') {
      game.muted = !game.muted;
      setMuted(game.muted);
      return;
    }
    if (game.phase !== PHASE.PLAYING) return;
    unlockAudio();
    const ing = INGREDIENTS.find((i) => i.key === key);
    if (ing) { addIngredient(game, ing.id); return; }
    if (key === ' ') { event.preventDefault(); servePlate(game); }
    if (key === 't') trashPlate(game);
    if (key === 'g') takeFromGrill(game, 0);
    if (key === 'c') takeFromBoard(game, 0);
  });
}

export function startShift(game) {
  game.phase = PHASE.PLAYING;
  game.frozen = false;
  sfx.ready();
}

export function restartShift(game) {
  resetGame(game, game.seed + 1);
  game.phase = PHASE.PLAYING;
  sfx.ready();
}
