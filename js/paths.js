// Resolves the asset paths a game pack declares.
//
// Packs write paths relative to the project root ("sprites/x.webp"), which is
// what a page at the root needs — but the second game lives at /jungle/, and
// GitHub Pages serves the whole site under /ragnar-runner/. A bare relative
// path is resolved against the *page*, so it breaks on the first and an
// absolute one breaks on the second.
//
// import.meta.url is the fixed point out of that: this module's own URL is
// known to be <project root>/js/paths.js on every host and from every page,
// so the root is one level up from it.
const ROOT = new URL('../', import.meta.url);

export function asset(path) {
  return new URL(path, ROOT).href;
}
