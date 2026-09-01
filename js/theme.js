// Seasonal skin for the interface. The palettes themselves live in
// css/style.css under `:root[data-theme="..."]`, and the in-game overlay in
// js/seasonal.js; this module only decides which theme is active and stamps it
// on <html>.
//
// Deliberately month-based rather than date-range-based: the request was "the
// interface changes with the month", and a whole month is also long enough
// that players actually notice the theme instead of catching a three-day
// window. Months with no theme fall through to the default palette.
//
// One table, keyed by theme, is the whole configuration: the month that
// triggers it and the badge the start screen shows so players know why the
// game suddenly looks different.
const THEMES = {
  amistad: { month: 8, mark: '💘', label: 'September Edition', note: 'Amor y amistad' },
  halloween: { month: 9, mark: '🎃', label: 'October Edition', note: 'Halloween' },
  navidad: { month: 11, mark: '🎄', label: 'December Edition', note: 'Navidad' },
};

export function themeForMonth(month) {
  const found = Object.entries(THEMES).find(([, def]) => def.month === month);
  return found ? found[0] : null;
}

export function applySeasonalTheme(date = new Date()) {
  const theme = themeForMonth(date.getMonth());
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  return theme;
}

// The canvas layer needs the same answer the CSS is using, and asking the DOM
// keeps this a single source of truth: `?theme=` overrides and the month
// mapping are both already baked into the attribute by the time anything
// renders.
export function activeTheme() {
  return document.documentElement.dataset.theme || null;
}

// Called from main.js rather than run here: this module is loaded from <head>
// so the palette beats the first paint, which means the start screen does not
// exist yet at that point.
//
// The label follows the *theme*, not the clock — with `?theme=halloween` in
// September the badge has to say October, or it would explain the wrong thing.
export function renderSeasonBadge(el) {
  if (!el) return;
  const def = THEMES[activeTheme()];
  if (!def) return; // no theme this month: the badge stays hidden
  el.textContent = `${def.mark} ${def.label} · ${def.note}`;
  el.classList.remove('hidden');
}

// `?theme=halloween` forces a theme, so the seasonal looks can be reviewed
// (and screenshotted) out of season without touching the clock.
const forced = new URLSearchParams(location.search).get('theme');
if (forced && Object.prototype.hasOwnProperty.call(THEMES, forced)) {
  document.documentElement.dataset.theme = forced;
} else {
  applySeasonalTheme();
}
