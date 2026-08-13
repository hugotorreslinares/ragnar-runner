# DESIGN.md

Architecture and design decisions for Ragnar Runner. Read before making structural changes.

## Stack

Vanilla HTML5 Canvas + JS, one file (`index.html`), no build step, no dependencies. Intentional — this is a field-test demo, not a production app that needs a framework.

## Rendering pipeline

Single `<canvas id="game" width="800" height="480">`, 2D context. Fixed internal resolution (800×480), scaled to fit via CSS (`aspect-ratio: 800/480`, `width:100%`). `GROUND_Y = 390` is the one authoritative ground line constant — background, obstacles, and player all key off it.

Main loop: `requestAnimationFrame(loop)` → `update(dt)` then `draw()`. `dt` is normalized to ~60fps units and clamped to 2.5 to avoid physics blowups after a tab-switch stall.

## Sprite system

One spritesheet (`sprites/spritesheet.png`), grid-packed, transparent background, feet bottom-anchored per cell so frames line up. Geometry is declared once:

```js
const SHEET = {
  src: 'sprites/spritesheet.png',
  frameW: 182, frameH: 193,
  anims: { run: {row:0, frameCount:24}, jump: {row:1, frameCount:23} }
};
```

`sheetRect(animName, frameIndex)` is the *only* place that turns `(row, frameIndex)` into a source rectangle. Drawing is one `ctx.drawImage(sheetImg, sx, sy, sw, sh, dx, dy, dw, dh)` call. Adding a new animation = new row in the PNG + new entry in `SHEET.anims`. Never add per-frame files or hand-picked offsets elsewhere.

Run animation loops continuously, rate tied to current speed (`animPhase`). Jump animation is *scrubbed*, not looped — `curFrame` is derived from `jumpElapsed / JUMP_TOTAL_FRAMES`, so the sprite pose always matches actual flight progress, not wall-clock time.

Fallback: if the sheet fails to load (`sheetImg.onerror`, or a 2.5s timeout guard), `useFallbackArt = true` and a vector stick-runner (`drawFallbackRunner`) is drawn instead. The game must never hard-fail to render.

## Background

`sprites/background.jpg` is a single non-tileable city photo, not a seamless tile. Two tricks make it work as an infinite scroller:

1. **Ground alignment**: `BG_ROAD_SRC_Y` (source-image pixel row where the curb meets the road) is scaled so it lands exactly on `GROUND_Y`. One scale factor (`GROUND_Y / BG_ROAD_SRC_Y`) drives both `dw`/`dh` and vertical offset.
2. **Mirror tiling**: every other repeat is drawn mirrored (`ctx.scale(-1,1)`), so the shared edge between tiles always matches itself pixel-for-pixel — no visible seam, even though the source art isn't tileable. Trade-off: on mirrored tiles the "TALLER" signage reads backwards. Accepted, not a bug.

Background scrolls at `parallax = 0.55` of world speed for depth. Foreground (obstacles, ground ticks, player) scrolls at full `scrollX`.

## Physics / feel

- `GRAVITY = 0.82`, `JUMP_VELOCITY = -13.6`. `JUMP_TOTAL_FRAMES` is derived (`2*|JUMP_VELOCITY|/GRAVITY`), not hand-tuned — keep it derived if you change gravity or jump velocity, don't let it drift out of sync.
- Speed model: `baseSpeed` ramps slowly with `elapsed` (difficulty curve, capped at 10.5). Player's right/left input adds a boost/slowdown offset on top, and `curSpeed` eases toward the desired value rather than snapping (`curSpeed += (desired-curSpeed)*0.12*dt`) for smooth accel/decel feel.
- Collision uses a shrunk hitbox relative to the drawn sprite (`boxW = pDrawW*0.42`, `boxH = pDrawH*0.72`) so near-misses feel fair against the visual sprite bounds.

## Obstacle generation

`spawnObstacle()` picks crate (55%) or barrel (45%), with size jitter. Gap between obstacles shrinks slowly with `elapsed` but is clamped to a `gapClamped >= 300` minimum — difficulty ramps without ever becoming unfair/impossible. Obstacles are world-space (`worldX`), converted to screen space at draw/collision time via `worldX - scrollX`; spawned ahead of the visible window, culled once far behind it.

## State machine

`STATE = { READY, PLAYING, OVER }`. Three lives, distance-based score (`floor(scrollX/8)`), best score persisted to `localStorage`. Getting hit costs a life, grants brief invulnerability (`player.invuln`) with a flicker, and knocks `curSpeed` down as feedback — doesn't reset the run.

## Global leaderboard

Backed by Supabase (public REST + anon key, client-side — safety comes from Row Level Security on the `scores` table, not key secrecy). `fetchLeaderboard`/`submitScoreToLeaderboard` are thin `fetch()` wrappers; failures degrade gracefully to a "couldn't reach leaderboard" message rather than blocking gameplay. Name is uppercased, capped at 12 chars, remembered in `localStorage` for next run.

## Failure philosophy

Every external asset/network dependency (spritesheet, background image, leaderboard fetch) has a fallback path so a slow network or blocked asset degrades the experience rather than breaking the game. A global `window.onerror` handler surfaces any uncaught script error as a visible on-canvas banner instead of failing silently — keep this when editing the bootstrap code.

## Extending

- New animation: add a row to the spritesheet PNG + entry in `SHEET.anims`. No other code changes needed.
- New obstacle type: extend `spawnObstacle()`'s `roll` branching and add a `drawX()` function following `drawCrate`/`drawBarrel`'s pattern (world→screen `x` already resolved by caller, size params only).
- Tuning difficulty/feel: prefer adjusting the existing derived constants (`baseSpeed` ramp, `gap` formula, `GRAVITY`/`JUMP_VELOCITY`) over adding new special-case branches.
