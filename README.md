# Ragnar Runner

An HTML5 side-scrolling runner built around the **Ragnar "El Coleccionista"** run-cycle spritesheet from [Taller de la Mancha](https://tallerdelamancha.com).

Play it here once GitHub Pages is enabled: `https://<your-username>.github.io/ragnar-runner/`

## Controls

| Key | Action |
|---|---|
| `→` | Run / speed up |
| `←` | Slow down / retreat |
| `↑` or `Space` | Jump over crates & barrels |

On touch devices, on-screen buttons appear automatically.

## Project layout

Vanilla HTML/CSS/JS, no build step, no dependencies — just ES modules loaded natively by the browser.

```
index.html          markup only
css/style.css        all styles
js/config.js          default constants (physics, star tiers, thresholds)
js/tuning.js          the live-tunable subset of those (TUNE) — what gameplay code reads
js/admin.js           the ?admin tuning panel; does nothing without the URL param
js/dom.js             DOM element references — the only file that queries the DOM by id
js/assets.js          image loading + spritesheet source-rect math
js/audio.js           music + hit sound (Web Audio) and the mute preference
js/leaderboard.js      Supabase fetch/submit/render + the submit-score UI flow
js/input.js            keyboard/touch capture (no game-flow knowledge)
js/state.js            game phase, the mutable per-run state object (G), resetGame()
js/entities.js         spawning/catching/colliding with obstacles, stars, debris
js/obstacles/          one draw module per obstacle type + the OBSTACLE_TYPES registry
js/obstacles/sprite.js image-backed obstacles (a picture instead of a draw function)
js/render.js           all canvas drawing
js/game.js             the update/draw loop + start/pause/end flow
js/main.js             wires DOM events to the modules above, starts the loop
```

Because it uses real `import`/`export` (not just several `<script>` tags sharing global scope), each file only sees what it explicitly imports — no accidental cross-file variable collisions. The trade-off: **ES modules require a local server**, they won't load over `file://`. See [Local dev](#local-dev).

## How it works

- **Background**: `sprites/background.webp`, a single (non-tileable) city photo. It's aligned so the sidewalk/curb line in the image lands exactly on the game's ground line, and it's tiled infinitely by mirroring every other repeat — the shared edge always matches itself exactly, so there's no visible seam. The trade-off: on mirrored repeats, the "TALLER" signage reads backwards. It scrolls at 55% of world speed for a parallax depth effect. The scenery changes as the run goes on — a second city photo past 4000 and a sunset (`sprites/background-sunset.webp`) past 5000 — all using the same trick; the stages are listed in `BACKGROUNDS` (`js/config.js`) and loaded on demand rather than up front.
- **Sound**: one 32-second music loop plus a hit sound, both shipped as Ogg Vorbis with an AAC copy for older Safari/iOS; the browser downloads only the one it can decode. Two details are deliberate. The music plays through Web Audio rather than `<audio loop>`, because `<audio loop>` is not gapless — measured at ~75 ms of silence per wrap, a hiccup every 32 seconds. An `AudioBufferSourceNode` with `loopEnd` set to the track's real length loops sample-accurately instead. `loopEnd` is a stated constant (`MUSIC_LOOP_SECONDS`) rather than `buffer.duration` because decoding adds codec padding — the 32.000 s file decodes to 32.016 s, and looping on that plays 16 ms of encoder tail before wrapping. Nothing is fetched until an idle callback after `load`, and nothing plays until the player presses Start, which is also the user gesture browsers require.
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
- Lives (up to 5, extra lives earned by collecting stars), distance-based scoring, best score saved via `localStorage`, and a global leaderboard backed by Supabase.
- If the spritesheet ever fails to load, a simple vector runner is drawn instead so the game never breaks.

## Editing the sprites

`sprites/spritesheet.png` is a single RGBA PNG, grid-packed, transparent background, bottom-center anchored per cell (so feet line up consistently frame to frame). Open it in Photoshop/GIMP/Photopea to clean up individual cells — as long as the grid geometry doesn't shift, no code changes are needed. If you resize the grid, update `SHEET.frameW` / `SHEET.frameH` (and `frameCount` per row) in `js/config.js` to match.

## Credits

Character art: **Taller de la Mancha**. Game code: built as a field-test demo of the run-cycle spritesheet.

## Local dev

ES modules need to be served over HTTP — opening `index.html` directly via `file://` will not work (the browser blocks module script loading from the filesystem). Run a local server from the project root, e.g.:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
