# Ragnar Runner

An HTML5 side-scrolling runner built around the **Ragnar "El Coleccionista"** run-cycle spritesheet from [Taller de la Mancha](https://tallerdelamancha.com).

Play it at [escape-bogota.vercel.app](https://escape-bogota.vercel.app/).

The same repo also runs as-is on GitHub Pages (Settings → Pages → *Deploy from a branch* → `main` / `/ (root)`), at `https://hugotorreslinares.github.io/ragnar-runner/`. No build step and nothing to configure: every path in the project is relative, and the manifest's `start_url`/`scope` are `"./"`, so the game works under the `/ragnar-runner/` subpath a project site is served from. The empty `.nojekyll` file keeps Pages from running the site through Jekyll, which would drop any file or folder whose name starts with `_`. Note the two deployments share one Supabase leaderboard but have separate `localStorage`, so a personal best does not follow the player between them.

## Controls

| Key | Action |
|---|---|
| `→` | Run / speed up |
| `←` | Slow down / retreat |
| `↑` or `Space` | Jump over crates & barrels |

On touch devices, on-screen buttons appear automatically.

## Project layout

Vanilla HTML/CSS/JS, no build step, no dependencies — just ES modules loaded natively by the browser.

The code is split in two: an **engine** that knows about running, jumping and colliding, and a **game pack** that knows it is set in Bogotá. The engine never names a sprite, a sound, a colour or a line of copy — it reads all of that from the active game.

```
index.html          markup only
css/style.css        all styles

—— the game ——
js/active-game.js      which game the engine runs — the one line you change
js/games/bogota/index.js       the content pack: art, copy, audio, scenery, feel
js/games/bogota/art.js         collectible, debris, stand-in runner, road colours
js/games/bogota/strings.json   every word the game shows — change text here, only here
js/games/bogota/obstacles/     this game's obstacle table + one draw module per type
js/games/jungle/               a second game (skeleton) on the same engine — see below

—— the engine ——
js/config.js          the engine's view of the active game (stable constant names)
js/strings.js         loads that JSON and fills the markup from it (t / applyStrings)
js/tuning.js          the live-tunable subset of those (TUNE) — what gameplay code reads
js/admin.js           the ?admin tuning panel; does nothing without the URL param
js/dom.js             DOM element references — the only file that queries the DOM by id
js/assets.js          image loading + spritesheet source-rect math
js/audio.js           music + hit sound (Web Audio) and the mute preference
js/leaderboard.js      Supabase fetch/submit/render + the submit-score UI flow
js/input.js            keyboard/touch capture (no game-flow knowledge)
js/state.js            game phase, the mutable per-run state object (G), resetGame()
js/entities.js         spawning/catching/colliding with obstacles, stars, debris
js/obstacles/index.js  which type spawns, when, and how one is drawn (no type names)
js/obstacles/sprite.js image-backed obstacles (a picture instead of a draw function)
js/render.js           all canvas drawing
js/game.js             the update/draw loop + start/pause/end flow
js/main.js             wires DOM events to the modules above, starts the loop
js/theme.js            picks the seasonal interface theme from the current month
js/seasonal.js         the canvas side of that theme (wash, moon/bats, hearts, snow)
```

## Changing any text

All copy — headings, buttons, the intro, HUD labels, leaderboard statuses, the game-over lines, the seasonal badge, even the `+1` that pops off a collected star — lives in `js/games/bogota/strings.json`. Edit that file and reload; no JavaScript is involved and there is nothing to rebuild.

The markup carries keys instead of words (`<button data-text="start.startButton">`), and code asks for them by the same key (`t('over.newBest', { score })`). `{score}`-style placeholders are filled at runtime: keep them spelled as they are, but they can be moved or dropped. A key that doesn't exist renders as the key itself and warns in the console — a visible `over.newBest` beats a silently blank button.

Two things stay in `index.html` on purpose: the `<title>` and the `<meta>`/Open Graph description. Search engines and link previews read those before any script runs, so moving them into JSON would cost the site its search listing and its WhatsApp preview for nothing.

## Making a different game

A gorilla in the jungle or a skater downtown is the same engine with a different pack:

1. Copy `js/games/bogota/` to `js/games/<yourgame>/`.
2. Point `js/active-game.js` at it.
3. Replace the assets it names (spritesheet, backgrounds, audio, hero shots), the obstacle table, and `strings.json`. An obstacle can be a picture — `image:` plus a hitbox — so a new set does not mean writing canvas code.
4. Give it its own `storagePrefix` so the two games don't share saved best scores, and its own leaderboard table.
5. Edit the palette in `css/style.css`, the head metadata in `index.html`, and `manifest.json`. Those are the shell, not something the engine reads.

Nothing under `js/` outside `js/games/` should need to change. If it does, that is a leak worth fixing rather than working around.

### The jungle skeleton

`js/games/jungle/` is a working second game — a gorilla running under a burning canopy — and exists to keep the split honest: it runs on the engine with no engine changes at all. Point `js/active-game.js` at it to play it.

It ships **no image and no audio files**. The runner, the canopy, the collectible and all three obstacles are drawn in code, so it is playable before any art exists and each asset can be swapped in one at a time:

- add a spritesheet to `sheet` → the painted runner stops being used
- add entries to `backgrounds` → the painted canopy stops being called
- point `audio` at real files → the music starts
- swap an obstacle's `draw` for `image:` → that obstacle becomes a picture

Its physics and obstacle sizes are copied from Bogotá on purpose. Those numbers came out of jump-window measurements and the obstacle boxes were chosen against them, so changing one without re-measuring the other is how a runner quietly becomes unfair.

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
