# Ragnar Runner

A single-file HTML5 side-scrolling runner built around the **Ragnar "El Coleccionista"** run-cycle spritesheet from [Taller de la Mancha](https://tallerdelamancha.com).

Play it here once GitHub Pages is enabled: `https://<your-username>.github.io/ragnar-runner/`

## Controls

| Key | Action |
|---|---|
| `→` | Run / speed up |
| `←` | Slow down / retreat |
| `↑` or `Space` | Jump over crates & barrels |

On touch devices, on-screen buttons appear automatically.

## How it works

- Pure vanilla HTML/CSS/JS, no build step, no dependencies — everything (including the sprite frames) is inlined into `index.html` as base64 data URIs.
- Canvas-based side-scroller: hold `→` to build speed, `←` to back off, and time jumps to clear procedurally-spaced obstacles.
- 3 lives, distance-based scoring, best score saved via `localStorage`.
- If the sprite art ever fails to load for any reason, a simple vector runner is drawn instead so the game never breaks.

## Credits

Character art: **Taller de la Mancha**. Game code: built as a field-test demo of the run-cycle spritesheet.

## Local dev

No build step needed — just open `index.html` in a browser.
