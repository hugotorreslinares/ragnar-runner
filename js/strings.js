// Every word the game shows comes from one JSON file per game (GAME.strings).
// Nothing here knows what the text says — changing any copy is editing that
// file, never a .js file.
//
// It is fetched rather than imported: JSON modules still need import
// attributes that not every browser this game targets supports, and a fetch
// also means the file can be edited on a deployed site without a rebuild
// (there is no build step to begin with).
import { GAME } from './active-game.js';

let STRINGS = null;

export async function loadStrings() {
  const res = await fetch(GAME.strings, { cache: 'no-cache' });
  if (!res.ok) throw new Error('strings fetch failed: ' + res.status + ' ' + GAME.strings);
  STRINGS = await res.json();
}

// Dotted lookup with {placeholder} interpolation. A missing key returns the
// key itself and warns: a visible "over.newBest" in the UI is a far better
// failure than a blank element nobody notices.
export function t(path, vars) {
  let node = STRINGS;
  for (const part of path.split('.')) {
    if (node == null || typeof node !== 'object') { node = undefined; break; }
    node = node[part];
  }
  if (typeof node !== 'string') {
    console.warn('missing string:', path);
    return path;
  }
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole);
}

// Fills the markup from the same file. `data-text` sets an element's text;
// `data-text-<attribute>` sets an attribute, e.g. data-text-placeholder or
// data-text-aria-label. Text is written with textContent, never innerHTML —
// copy is data, and data never becomes markup.
export function applyStrings(root = document) {
  for (const el of root.querySelectorAll('[data-text]')) {
    el.textContent = t(el.dataset.text);
  }
  for (const el of root.querySelectorAll('*')) {
    for (const name of Object.keys(el.dataset)) {
      if (name === 'text' || !name.startsWith('text')) continue;
      // dataset gives us camelCase ("textAriaLabel"); turn it back into the
      // attribute name the author wrote ("aria-label").
      const attr = name.slice(4).replace(/([A-Z])/g, (m, c) => '-' + c.toLowerCase()).replace(/^-/, '');
      el.setAttribute(attr, t(el.dataset[name]));
    }
  }
}
