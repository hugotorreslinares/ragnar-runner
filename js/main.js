// Bootstrap — wires DOM events to the game/leaderboard/input modules and
// kicks off the render loop. Nothing here owns game logic itself.
import { canvas, lbStartList, lbOverList, lbSubmitBtn, lbNameInput, startBtn, restartBtn, pauseBtn, resumeBtn, muteBtn, isFormControlFocused } from './dom.js';
import { PHASE, phase, G } from './state.js';
import { startGame, togglePause, loop } from './game.js';
import { queueJump } from './input.js';
import { loadLeaderboardInto, handleSubmitScore } from './leaderboard.js';
import { toggleMute, isMuted } from './audio.js';
import './admin.js'; // no-op unless the URL has ?admin
import './install.js'; // "Install app" button — no-op outside Chromium

// The service worker exists so Chromium considers the game installable (see
// sw.js). Registration is deliberately late and failure-tolerant: nothing in
// the game depends on it, and a browser without support just skips it.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

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

// Start with a keypress from the ready screen — but NOT from the game-over
// screen. There, the run is over and its score is sitting unsubmitted next to
// a name field, so the same Space or Enter that has meant "jump" for the last
// few minutes would throw the score away before it was ever saved. Reported by
// a player who lost good runs to it. Restarting from game-over is deliberate
// only: the TRY AGAIN button.
//
// The focus guard stays for the ready screen: Space/Enter on a focused form
// control (the name field, the "Submit Score" button) must reach that control.
window.addEventListener('keydown', e => {
  if (isFormControlFocused()) return;
  if (phase === PHASE.READY && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter')){
    startGame();
  }
});
canvas.addEventListener('pointerdown', () => {
  if (phase === PHASE.PLAYING) queueJump();
  else if (phase === PHASE.READY) startGame();
  // game-over deliberately absent, for the same reason as the keyboard above
});

window.addEventListener('keydown', e => {
  if (isFormControlFocused()) return;
  if (e.code === 'Escape') togglePause();
});
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);

// Mute is a saved preference, so the button has to render the stored state
// on load, not assume unmuted.
function renderMuteBtn(){
  const m = isMuted();
  muteBtn.classList.toggle('muted', m);
  muteBtn.setAttribute('aria-pressed', String(m));
  muteBtn.setAttribute('aria-label', m ? 'Unmute music' : 'Mute music');
}
renderMuteBtn();
muteBtn.addEventListener('click', () => { toggleMute(); renderMuteBtn(); });

// Random Ragnar shot on the start screen. All three are 1024x1536 so they
// sit identically under `background-size: auto` — the CSS scrolls the image
// vertically at its native size, which means pixel dimensions ARE the zoom
// level, and a differently-sized file would visibly change the framing.
const ragnarImages = [
  'images/ragnar aiming.webp',
  'images/ragnar macdonalds.webp',
  'images/ragnar-tmlenio.webp',
];
const ragnarPanel = document.querySelector('.initial-image');
if (ragnarPanel){
  const pick = ragnarImages[Math.floor(Math.random() * ragnarImages.length)];
  ragnarPanel.style.backgroundImage = 'url("' + encodeURI(pick) + '")';
}

requestAnimationFrame(loop);
