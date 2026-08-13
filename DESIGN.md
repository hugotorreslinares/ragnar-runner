# DESIGN.md

Architecture and design decisions for Ragnar Runner. Read before making structural changes.

## Stack

Vanilla HTML5 Canvas + JS, split into ES modules under `js/` (see [README.md](README.md#project-layout) for the file map). No build step, no dependencies — the browser's native `import`/`export` does the module loading, which is why the game must be served over HTTP (not opened via `file://`).

## Rendering pipeline

Single `<canvas id="game" width="800" height="480">`, 2D context (`js/dom.js` owns the reference). Fixed internal resolution (800×480), scaled to fit via CSS (`aspect-ratio: 800/480`, `width:100%`). `GROUND_Y = 390` (`js/config.js`) is the one authoritative ground line constant — background, obstacles, stars, and player all key off it.

Main loop (`js/game.js`): `requestAnimationFrame(loop)` → `update(dt)` then `draw()`. `dt` is normalized to ~60fps units (dt≈1 per frame at 60fps, ~60 per real second) and clamped to 2.5 to avoid physics blowups after a tab-switch stall.

**dt-unit convention**: anything meant to represent a real-world duration (invulnerability window, screen shake, popup fade) must decrement by `dt/60`, not raw `dt`. Decrementing by raw `dt` drains what looks like a "1.6 second" timer in about 2 frames, since `dt` accumulates ~60 units per second, not 1. `player.invuln`, `shakeT`, `starPop`, and `debris[].t` all follow this. (`hitFlash` and `starPopups[].t` use their own small multipliers instead — same idea, different constant, both correct — don't "fix" them to match `dt/60`.)

## State

`js/state.js` exports `G`, a single mutable object holding all per-run data (player, obstacles, stars, debris, scrollX, score, lives, etc.) plus `PHASE`/`phase` (the READY/PLAYING/PAUSED/OVER state machine) and the HUD-update functions. Every other module imports `G` and mutates its properties directly (`G.foo = ...`); nothing keeps a parallel copy of game state.

`resetGame()` (in `state.js`) is the only place that re-initializes a run — it's called once by `startGame()` (`js/game.js`).

## Sprite system

One spritesheet (`sprites/spritesheet.png`), grid-packed, transparent background, feet bottom-anchored per cell so frames line up. Geometry is declared once, in `js/config.js`:

```js
export const SHEET = {
  src: 'sprites/spritesheet.png',
  frameW: 182, frameH: 193,
  anims: { run: {row:0, frameCount:24}, jump: {row:1, frameCount:23} }
};
```

`sheetRect(animName, frameIndex)` (`js/assets.js`) is the *only* place that turns `(row, frameIndex)` into a source rectangle. Drawing (`js/render.js`) is one `ctx.drawImage(sheetImg, sx, sy, sw, sh, dx, dy, dw, dh)` call. Adding a new animation = new row in the PNG + new entry in `SHEET.anims`. Never add per-frame files or hand-picked offsets elsewhere.

Run animation loops continuously, rate tied to current speed (`animPhase`). Jump animation is *scrubbed*, not looped — `curFrame` is derived from `jumpElapsed / JUMP_TOTAL_FRAMES`, so the sprite pose always matches actual flight progress, not wall-clock time.

Fallback: if the sheet fails to load (`sheetImg.onerror`, or a 2.5s timeout guard in `js/assets.js`), `useFallbackArt = true` and a vector stick-runner (`drawFallbackRunner` in `js/render.js`) is drawn instead. The game must never hard-fail to render.

## Background

Two interchangeable city photos (`sprites/background.jpg`, then `sprites/background-bogota.png` past `BG_SWITCH_SCORE` distance), neither seamlessly tileable on their own. Two tricks make either work as an infinite scroller:

1. **Ground alignment**: each photo has its own `roadSrcY` constant (`BG_ROAD_SRC_Y` / `BG_ROAD_SRC_Y_2` in `js/config.js`) — the source-image pixel row where the curb meets the road — scaled so it lands exactly on `GROUND_Y`. One scale factor (`GROUND_Y / roadSrcY`) drives both `dw`/`dh` and vertical offset.
2. **Mirror tiling**: every other repeat is drawn mirrored (`ctx.scale(-1,1)`), so the shared edge between tiles always matches itself pixel-for-pixel — no visible seam, even though the source art isn't tileable. Trade-off: on mirrored tiles the "TALLER" signage reads backwards. Accepted, not a bug.

Background scrolls at `parallax = 0.55` of world speed for depth. Foreground (obstacles, stars, ground ticks, player) scrolls at full `G.scrollX`.

## Physics / feel

- `GRAVITY = 0.80`, `JUMP_VELOCITY = -13.6` (`js/config.js`). `JUMP_TOTAL_FRAMES` is derived (`2*|JUMP_VELOCITY|/GRAVITY`), not hand-tuned — keep it derived if you change gravity or jump velocity, don't let it drift out of sync.
- The jump is a fixed-velocity launch — there's no variable jump height (no "hold to jump higher"). Every jump sweeps the player's height through the *entire* 0..max range. This matters for star collision below.
- Speed model: `G.baseSpeed` ramps slowly with `G.elapsed` (difficulty curve, capped at `BASE_SPEED_CAP = 11.0`). Player's right/left input adds a boost/slowdown offset on top, and `G.curSpeed` eases toward the desired value rather than snapping (`curSpeed += (desired-curSpeed)*0.12*dt`) for smooth accel/decel feel.
- Collision uses a shrunk hitbox relative to the drawn sprite (`boxW = pDrawW*0.42`, `boxH = pDrawH*0.72`) so near-misses feel fair against the visual sprite bounds.
- **Tunneling**: at high `curSpeed`/large `dt`, an object's screen position can jump clean past the collision window within a single frame. Obstacle collision is checked against the sprite's current bounds each frame (window is wide enough in practice); star collision is explicitly *swept* on both x and jump-height, comparing the whole path traveled during the frame (`sx..sx+scrollDelta`, `prevJumpHeight..jumpHeight`) rather than just the frame's endpoint — see `js/game.js`'s `update()`.

## Obstacle generation & collision

`spawnObstacle()` (`js/entities.js`) picks crate (55%) or barrel (45%), with size jitter. Gap shrinks slowly with `G.elapsed` but is clamped to `gapClamped >= 300` minimum — difficulty ramps without ever becoming unfair/impossible. Obstacles are world-space (`worldX`), converted to screen space at draw/collision time via `worldX - G.scrollX`; spawned ahead of the visible window, culled once far behind it.

Each obstacle can only cost one life: on overlap it's flagged `o.hit = true` and filtered out of `G.obstacles` that same frame — without this, a slowed-down player (see "stumble" below) could linger on top of the same obstacle across frames and take repeated hits.

On hit: `launchDebris()` converts the obstacle into a screen-space "debris" object (its own velocity/rotation, independent of world scroll) that flies off and fades over ~0.9s, so a collision reads as an unmistakable event rather than a silent life decrement. `hitPlayer()` decrements a life, grants `1.6`s of invulnerability with a flicker, triggers a screen shake + red flash + "-1" popup, and **stumbles the player to a dead stop** (`curSpeed = 0`, then eases back up via the normal accel curve) — deliberately, not a bug, so a hit is felt.

## Stars

`spawnStar()` (`js/entities.js`) picks a difficulty tier from `STAR_TIERS` (`js/config.js`) — each tier is a `{weight, offsetMin, offsetMax, r}` bucket: low `groundOffset` + big radius = easy/forgiving, high `groundOffset` (near the max jump height) + small radius = hard. Stars can only be caught mid-jump (`!G.player.onGround`).

Because the jump is fixed-height (sweeps the *entire* height range every time — see Physics above), the catch window can't rely on height alone to gate difficulty; the vertical tolerance (`s.r * 1.6`) is tied to the star's radius, checked against the actual swept path for the frame.

The horizontal window (`s.r*2 + 15 + |G.player.vy|*2.2`) looks fiddly but each term earns its place:
- `s.r*2 + 15` scales *multiplicatively* with radius, not additively (`s.r + 20`) — a flat bonus is a bigger fraction of a small star's own size than a big star's, so a flat-bonus window made big/"easy" stars proportionally *less* forgiving than small/"hard" ones (verified by simulating effective catch width per tier — see git history). Multiplicative scaling keeps easy tiers actually easier.
- `+ |G.player.vy|*2.2` compensates for dwell time: a fixed-velocity jump moves fast near the ground and slowly near the apex, so low stars are swept past in far fewer frames than high ones. Without this term, low/easy-tier stars are effectively harder to catch than intended, despite their bigger nominal radius.

A loose/generous window (e.g. tied to the drawn player sprite's full width) makes every star catchable by any nearby jump regardless of timing, which defeats the tiering — keep the window tied to the star, not the player sprite.

Every `STARS_PER_LIFE` (10) stars collected grants +1 life, capped at `MAX_LIVES` (5). The life-icon HUD (`js/state.js`) is generated from `MAX_LIVES` at startup rather than hardcoded in HTML, so the two stay in sync if `MAX_LIVES` changes.

## Pause

`PHASE.PAUSED` (`js/state.js`). Toggled by `Escape` or the always-visible `#pauseBtn` (`js/game.js`'s `togglePause()`, wired in `js/main.js`). `update()` is a no-op whenever `phase !== PHASE.PLAYING`, so pausing just stops calling it — `draw()` keeps running every frame so the pause overlay renders. Pausing clears any in-flight input (`clearInput()` in `js/input.js`) so a held key or a queued jump doesn't fire the instant the game resumes.

## Global leaderboard

Backed by Supabase (`js/leaderboard.js`): public REST + anon key, client-side. **Data integrity comes from the `scores` table's own CHECK constraints** (score range, name length) — the RLS insert policy itself permits any row shape, so don't assume RLS alone bounds submitted data; add a matching CHECK constraint for any new submitted field. `fetchLeaderboard`/`submitScoreToLeaderboard` are thin `fetch()` wrappers; failures degrade gracefully to a "couldn't reach leaderboard" message rather than blocking gameplay. Name is uppercased, capped at 12 chars, remembered in `localStorage` for next run. Rendered rows coerce `score` to a number and escape `player_name` before touching `innerHTML`.

## Failure philosophy

Every external asset/network dependency (spritesheet, both background images, leaderboard fetch) has a fallback path so a slow network or blocked asset degrades the experience rather than breaking the game. An inline (non-module) `window.onerror` handler in `index.html` — registered before any module script runs, so it can catch module load/parse failures too — surfaces any uncaught script error as a visible on-canvas banner instead of failing silently.

## Extending

- New animation: add a row to the spritesheet PNG + entry in `SHEET.anims` (`js/config.js`). No other code changes needed.
- New obstacle type: extend `spawnObstacle()`'s `roll` branching (`js/entities.js`) and add a `drawX()` function in `js/render.js` following `drawCrate`/`drawBarrel`'s pattern (world→screen `x` already resolved by caller, size params only). If it should fly on hit, add a matching branch to `drawDebrisPiece()`.
- New star tier or difficulty curve: add/adjust an entry in `STAR_TIERS` (`js/config.js`) — no code changes needed elsewhere.
- Tuning difficulty/feel: prefer adjusting the existing derived constants (`baseSpeed` ramp, `gap` formula, `GRAVITY`/`JUMP_VELOCITY`) over adding new special-case branches.
