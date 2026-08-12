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

- Pure vanilla HTML/CSS/JS, no build step, no dependencies.
- Sprite frames live as individual PNG files in `/sprites` (`frame_00.png`–`frame_10.png`), each with a transparent background — edit them directly in Photoshop/GIMP/Photopea if you need to touch up any artifacts.
- Canvas-based side-scroller: hold `→` to build speed, `←` to back off, and time jumps to clear procedurally-spaced obstacles.
- 3 lives, distance-based scoring, best score saved via `localStorage`.
- If the sprite art ever fails to load for any reason, a simple vector runner is drawn instead so the game never breaks.

## Editing the sprites

Each frame in `/sprites` is 126×117px (native resolution extracted from the source spritesheet), RGBA with transparency already cut out. After editing, just overwrite the file in place — the game reloads it on next refresh, no code changes needed as long as the filenames (`frame_00.png` … `frame_10.png`) and canvas size stay the same.

## Credits

Character art: **Taller de la Mancha**. Game code: built as a field-test demo of the run-cycle spritesheet.

## Local dev

No build step needed — just open `index.html` in a browser.
