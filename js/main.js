// Bootstrap — wires DOM events to the game/leaderboard/input modules and
// kicks off the render loop. Nothing here owns game logic itself.
import { canvas, lbStartList, lbOverList, lbSubmitBtn, lbNameInput, startBtn, restartBtn, pauseBtn, resumeBtn, isFormControlFocused } from './dom.js';
import { PHASE, phase, G } from './state.js';
import { startGame, togglePause, loop } from './game.js';
import { queueJump } from './input.js';
import { loadLeaderboardInto, handleSubmitScore } from './leaderboard.js';
import './admin.js'; // no-op unless the URL has ?admin

try {
  const savedName = localStorage.getItem('ragnarName');
  if (savedName) lbNameInput.value = savedName;
} catch (e) {}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
loadLeaderboardInto(lbStartList, 5);

lbSubmitBtn.addEventListener('click', () => handleSubmitScore(G.score));
lbNameInput.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') handleSubmitScore(G.score);
});
lbNameInput.addEventListener('keyup', e => e.stopPropagation());

// allow starting/jumping with a keypress from the ready screen too — but
// never while a form control (name input, submit button, ...) has focus:
// Space/Enter on the focused "Submit Score" button, for example, must
// activate that button, not blow away the run that hasn't been submitted yet.
window.addEventListener('keydown', e => {
  if (isFormControlFocused()) return;
  if ((phase === PHASE.READY || phase === PHASE.OVER) && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter')){
    startGame();
  }
});
canvas.addEventListener('pointerdown', () => {
  if (phase === PHASE.PLAYING) queueJump();
  else if (phase === PHASE.READY || phase === PHASE.OVER) startGame();
});

window.addEventListener('keydown', e => {
  if (isFormControlFocused()) return;
  if (e.code === 'Escape') togglePause();
});
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);

requestAnimationFrame(loop);
