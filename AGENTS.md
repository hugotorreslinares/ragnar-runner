# AGENTS.md

Guidance for AI coding agents (Claude, Copilot, Codex, etc.) working in this repo.

## Project shape

- Vanilla HTML/CSS/JS split into ES modules. No build step, no bundler, no package.json, no npm dependencies. See [README.md](README.md#project-layout) for the file-by-file breakdown.
- Assets: `sprites/spritesheet.png` (run + jump grid), `sprites/background.webp` (city photo), `sprites/background-bogota.webp` (second background, past a distance threshold).
- No test suite. Verify changes by running `python3 -m http.server` from the repo root and opening the served URL — **ES modules do not load over `file://`**, don't tell the user to just double-click `index.html`.

## Ground rules

- Keep it zero-build vanilla JS/ES-modules unless the user explicitly asks to add tooling. Don't introduce a framework, bundler, or npm dependency.
- Respect the module boundaries in `js/` — put changes in the file that already owns that concern (see README's table) rather than reaching into another module's internals or duplicating logic across files. If a change doesn't fit any existing module, ask before inventing a new one.
- `state.js`'s `G` object is the single source of mutable per-run game data. Mutate its properties (`G.foo = ...`) from any module that imports it; don't create parallel state elsewhere.
- Any constant that affects gameplay *feel* (physics, speed, lives, star quota — see `js/tuning.js`) should be read from `TUNE.xxx`, not imported from `config.js` directly, so it stays live-editable via the `?admin` panel. Purely structural constants (sprite geometry, background alignment) stay in `config.js` only.
- Preserve the existing architecture documented in [DESIGN.md](DESIGN.md) — read it before making structural changes (sprite system, animation timing, obstacle spawning, background tiling).
- Sprite/animation changes must go through `SHEET.anims` (row + frameCount, in `js/config.js`) and `sheetRect()` (`js/assets.js`). Never hand-pick per-frame files or hardcode pixel offsets outside that function.
- Adding an obstacle type = a new draw module under `js/obstacles/` plus one entry in `OBSTACLE_TYPES` (`js/obstacles/index.js`). Never add an if/else or switch on `o.type` in spawning or rendering code — the registry is the only place that enumerates types.
- If you resize the spritesheet grid, update `SHEET.frameW` / `SHEET.frameH` / `frameCount` together in `js/config.js` — they must match the actual PNG.
- An obstacle can be declared with `image:` (a picture) instead of `draw:` (a render function) — prefer the picture for new obstacles unless the art needs to react to state. Either way the hitbox comes from `size()`, never from the artwork.
- Music must loop through Web Audio with an explicit `loopEnd` (`js/audio.js`), not `<audio loop>` — the element's loop leaves an audible gap, and `buffer.duration` includes codec padding. Anything that plays a sound goes through `js/audio.js` so the mute preference keeps covering it.
- The vector fallback runner (`drawFallbackRunner` in `js/render.js`) must keep working if `sprites/spritesheet.png` fails to load — don't remove the `useFallbackArt` path.
- Game must never hard-crash silently: the inline `window.addEventListener('error', ...)` banner in `index.html` is intentional (kept as a classic script, not a module, so it registers before any module load can fail) — don't remove it.
- Timers meant to represent real seconds (invulnerability windows, shake, popup fades) must decrement by `dt/60`, not raw `dt` — `dt` is in ~60fps-frame units (~60 per real second), so decrementing by raw `dt` drains a "1.6 second" timer in about 2 frames. See the comment in `js/game.js`'s `update()`.

## Leaderboard / Supabase

- The Supabase URL and anon/publishable key in `js/leaderboard.js` are meant to be public (client-side) — not a leaked secret. Don't "fix" this by hiding them.
- Data integrity comes from the `scores` table's own CHECK constraints (score range, name length), not from the RLS insert policy (which permits any row shape) or key secrecy. Don't rely on RLS alone if adding new submitted fields — add a matching CHECK constraint.
- Never add other secret keys (service role keys, etc.) to this client-side code.
- Always escape/coerce user- or API-supplied values before inserting them into `innerHTML` (see `escapeHtml` and the numeric coercion on `score` in `renderLeaderboard`).

## Style

- Match existing code style: `const`/`let`, no semicolon-less style, comments only where they explain non-obvious "why" (see existing comments as the bar).
- CSS uses custom properties in `:root` (`css/style.css`) for the palette — reuse `--amber`, `--paper`, `--ink`, etc. rather than introducing new hardcoded colors.

## After changes

- Serve via `python3 -m http.server` and manually test: start screen loads, arrow keys/space work, jump animation syncs, collision/lives work, star collection + life bonus, pause (Escape + button), game-over + leaderboard submit flow works, touch buttons appear on mobile widths.
- If editing `sprites/spritesheet.png`, verify grid geometry didn't shift (feet still bottom-anchored per cell) before assuming no code change is needed.
- Check the browser console for module load/import errors after any change to `js/` file structure or import paths.
