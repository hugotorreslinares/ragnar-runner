// Debug/tuning panel — only built when the URL has an "admin" query param
// (e.g. index.html?admin). Lets every TUNE.* value (see tuning.js) be
// adjusted live, no reload, so a good feel can be found by playtesting
// instead of guessing constants and reloading each time.
import { TUNE, jumpTotalFrames } from './tuning.js';
import { rebuildLivesUI, updateSpeedUI, updateStarsUI } from './state.js';

const FIELDS = [
  { key: 'GRAVITY', label: 'Gravity', step: 0.01, min: 0.1, max: 2 },
  { key: 'JUMP_VELOCITY', label: 'Jump velocity (negative)', step: 0.1, min: -30, max: -1 },
  { key: 'START_SPEED', label: 'Start speed', step: 0.1, min: 0.5, max: 20 },
  { key: 'BASE_SPEED_CAP', label: 'Max speed', step: 0.5, min: 1, max: 40 },
  { key: 'RAMP_RATE', label: 'Ramp rate (speed/frame)', step: 0.001, min: 0, max: 0.2 },
  { key: 'MIN_SAFE_SPEED', label: 'Min safe speed', step: 0.1, min: 0.5, max: 20 },
  { key: 'JUMP_SPEED_MULT', label: 'Jump speed mult', step: 0.05, min: 0.1, max: 2 },
  { key: 'MAX_LIVES', label: 'Max lives', step: 1, min: 1, max: 10 },
  { key: 'STARS_PER_LIFE', label: 'Stars per life', step: 1, min: 1, max: 50 },
];

function init(){
  if (!new URLSearchParams(location.search).has('admin')) return;

  const panel = document.createElement('div');
  panel.id = 'adminPanel';
  panel.innerHTML =
    '<div class="admin-title">⚙ TUNING <button id="adminCollapse" type="button">–</button></div>' +
    '<div class="admin-body">' +
      FIELDS.map(f => (
        '<label class="admin-row">' +
          '<span>' + f.label + '</span>' +
          '<input type="number" step="' + f.step + '" min="' + f.min + '" max="' + f.max +
            '" data-key="' + f.key + '" value="' + TUNE[f.key] + '">' +
        '</label>'
      )).join('') +
      '<div class="admin-hint">Jump airtime: <span id="adminJumpFrames"></span> frames' +
        ' &nbsp;·&nbsp; reach: <span id="adminJumpReach"></span>px</div>' +
    '</div>';
  document.body.appendChild(panel);

  const jumpFramesEl = panel.querySelector('#adminJumpFrames');
  const jumpReachEl = panel.querySelector('#adminJumpReach');
  function refreshDerived(){
    const frames = jumpTotalFrames();
    jumpFramesEl.textContent = frames.toFixed(1);
    jumpReachEl.textContent = (TUNE.MIN_SAFE_SPEED * TUNE.JUMP_SPEED_MULT * frames).toFixed(0);
  }

  panel.querySelectorAll('input[data-key]').forEach(input => {
    input.addEventListener('input', () => {
      const key = input.dataset.key;
      const val = parseFloat(input.value);
      if (!Number.isFinite(val)) return;
      TUNE[key] = val;
      if (key === 'MAX_LIVES') rebuildLivesUI();
      if (key === 'BASE_SPEED_CAP') updateSpeedUI();
      if (key === 'STARS_PER_LIFE') updateStarsUI();
      refreshDerived();
    });
  });
  refreshDerived();

  panel.querySelector('#adminCollapse').addEventListener('click', () => {
    panel.classList.toggle('collapsed');
  });
}
init();
