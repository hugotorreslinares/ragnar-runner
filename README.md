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
- **One real spritesheet** (`sprites/spritesheet.png`): a uniform grid where every cell is exactly `SHEET.frameW × SHEET.frameH`. Row 0 is the run cycle (24 frames), row 1 is the jump cycle (23 frames). The game never hand-picks a file — it always derives the source rectangle from `(row, frameIndex)`:
  ```js
  function sheetRect(animName, frameIndex){
    const a = SHEET.anims[animName];
    const idx = frameIndex % a.frameCount;
    return { sx: idx * SHEET.frameW, sy: a.row * SHEET.frameH, sw: SHEET.frameW, sh: SHEET.frameH };
  }
  ```
  Drawing a frame is then a single `ctx.drawImage(sheetImg, sx, sy, sw, sh, dx, dy, dw, dh)` call. Adding a new animation later is just adding a new row + an entry in `SHEET.anims` — no new files, no per-frame code.
- The **run** animation loops continuously at a rate tied to current speed. The **jump** animation is scrubbed by actual flight progress (`jumpElapsed / totalJumpFrames`), so the pose you see is always in sync with how high/long the jump physics say you should be in the air — not a fixed frame rate.
- 3 lives, distance-based scoring, best score saved via `localStorage`.
- If the spritesheet ever fails to load, a simple vector runner is drawn instead so the game never breaks.

## Editing the sprites

`sprites/spritesheet.png` is a single RGBA PNG, grid-packed, transparent background, bottom-center anchored per cell (so feet line up consistently frame to frame). Open it in Photoshop/GIMP/Photopea to clean up individual cells — as long as the grid geometry doesn't shift, no code changes are needed. If you resize the grid, update `SHEET.frameW` / `SHEET.frameH` (and `frameCount` per row) in `index.html` to match.

## Credits

Character art: **Taller de la Mancha**. Game code: built as a field-test demo of the run-cycle spritesheet.

## Local dev

No build step needed — just open `index.html` in a browser.
