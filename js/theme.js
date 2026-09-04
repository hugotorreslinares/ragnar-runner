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
// Which month triggers which theme, and nothing else — the badge's wording
// lives with the rest of the copy, under `season` in the game's strings file.
const THEMES = {
  amistad: { month: 8 },
  halloween: { month: 9 },
  navidad: { month: 11 },
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
// so the palette beats the first paint, which means neither the start screen
// nor the strings file exist yet at that point.
//
// The translator is passed in rather than imported for the same reason. This
// module must stay dependency-free: importing js/strings.js would drag the
// whole module graph — including js/dom.js, which grabs the canvas and its
// 2D context — into <head>, where the canvas has not been parsed yet.
//
// The label follows the *theme*, not the clock — with `?theme=halloween` in
// September the badge has to say October, or it would explain the wrong thing.
export function renderSeasonBadge(el, t) {
  if (!el) return;
  const theme = activeTheme();
  if (!THEMES[theme]) return; // no theme this month: the badge stays hidden
  el.textContent = t('season.badgeFormat', {
    mark: t(`season.${theme}.mark`),
    label: t(`season.${theme}.label`),
    note: t(`season.${theme}.note`),
  });
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
