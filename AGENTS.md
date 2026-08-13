# AGENTS.md

Guidance for AI coding agents (Claude, Copilot, Codex, etc.) working in this repo.

## Project shape

- Single-file game: all HTML/CSS/JS lives in [index.html](index.html). No build step, no bundler, no package.json, no dependencies.
- Assets: `sprites/spritesheet.png` (run + jump grid), `sprites/background.jpg` (city photo).
- No test suite. Verify changes by opening `index.html` in a browser (or `python3 -m http.server` + navigate) and playing.

## Ground rules

- Keep it a single-file, zero-build vanilla JS app unless the user explicitly asks to add tooling. Don't introduce a framework, bundler, or npm dependency.
- Don't split `index.html` into multiple files unless asked.
- Preserve the existing architecture documented in [DESIGN.md](DESIGN.md) — read it before making structural changes (sprite system, animation timing, obstacle spawning, background tiling).
- Sprite/animation changes must go through `SHEET.anims` (row + frameCount) and `sheetRect()`. Never hand-pick per-frame files or hardcode pixel offsets outside that function.
- If you resize the spritesheet grid, update `SHEET.frameW` / `SHEET.frameH` / `frameCount` together — they must match the actual PNG.
- The vector fallback runner (`drawFallbackRunner`) must keep working if `sprites/spritesheet.png` fails to load — don't remove the `useFallbackArt` path.
- Game must never hard-crash silently: the global `window.addEventListener('error', ...)` banner is intentional; don't remove it.

## Leaderboard / Supabase

- The Supabase URL and anon/publishable key in `index.html` are meant to be public (client-side, RLS-protected) — not a leaked secret. Don't "fix" this by hiding them.
- Do not weaken or bypass Supabase Row Level Security assumptions; treat the `scores` table as insert+select only, with score/name constraints enforced server-side.
- Never add other secret keys (service role keys, etc.) to this client-side file.

## Style

- Match existing code style: IIFE-wrapped vanilla JS, `const`/`let`, no semicolem-less style — follow what's already there.
- CSS uses custom properties in `:root` for the palette — reuse `--amber`, `--paper`, `--ink`, etc. rather than introducing new hardcoded colors.
- Keep comments minimal and only where they explain non-obvious "why" (see existing comments as the bar).

## After changes

- Manually test: start screen loads, arrow keys/space work, jump animation syncs, collision/lives work, game-over + leaderboard submit flow works, touch buttons appear on mobile widths.
- If editing `sprites/spritesheet.png`, verify grid geometry didn't shift (feet still bottom-anchored per cell) before assuming no code change is needed.
