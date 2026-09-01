// Seasonal skin for the interface. The palettes themselves live in
// css/style.css under `:root[data-theme="..."]`; this module only decides
// which one is active and stamps it on <html>.
//
// Deliberately month-based rather than date-range-based: the request was "the
// interface changes with the month", and a whole month is also long enough
// that players actually notice the theme instead of catching a three-day
// window. Months with no theme fall through to the default palette.
const THEME_BY_MONTH = {
  8: 'amistad', // September — amor y amistad
  9: 'halloween', // October
  11: 'navidad', // December
};

export function themeForMonth(month) {
  return THEME_BY_MONTH[month] || null;
}

export function applySeasonalTheme(date = new Date()) {
  const theme = themeForMonth(date.getMonth());
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  return theme;
}

// `?theme=halloween` forces a theme, so the seasonal looks can be reviewed
// (and screenshotted) out of season without touching the clock.
const forced = new URLSearchParams(location.search).get('theme');
if (forced && Object.values(THEME_BY_MONTH).includes(forced)) {
  document.documentElement.dataset.theme = forced;
} else {
  applySeasonalTheme();
}

// The canvas layer needs the same answer the CSS is using, and asking the DOM
// keeps this a single source of truth: `?theme=` overrides and the month
// mapping are both already baked into the attribute by the time anything
// renders.
export function activeTheme() {
  return document.documentElement.dataset.theme || null;
}
