// "Install app" button (Chromium only).
//
// Chrome and Edge fire `beforeinstallprompt` when the page qualifies as
// installable (manifest.json + a service worker with a fetch handler, over
// HTTPS or localhost). We keep the event and let the button replay it as a
// real install prompt.
//
// Safari has no equivalent API — adding a site to the Dock is a manual step
// in its Share menu — so the event never fires there and the button simply
// stays hidden. That is the intended behaviour, not a gap to patch: showing
// a button that cannot install anything would be worse than showing none.
import { installBtn } from './dom.js';

let deferredPrompt = null;

// Already running as an installed app: nothing to offer.
const installed = window.matchMedia('(display-mode: standalone)').matches;

window.addEventListener('beforeinstallprompt', e => {
  // Chromium would otherwise show its own mini-infobar; we want the prompt
  // to happen on the player's click, not on page load.
  e.preventDefault();
  deferredPrompt = e;
  if (!installed) installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  installBtn.disabled = true;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  // The event is single-use: whether the player accepted or dismissed it,
  // it cannot be replayed. Chromium fires a fresh one later if the player
  // is still eligible.
  deferredPrompt = null;
  installBtn.classList.add('hidden');
  installBtn.disabled = false;
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});
