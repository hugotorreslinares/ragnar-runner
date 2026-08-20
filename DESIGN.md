# DESIGN.md

Architecture and design decisions for Ragnar Runner. Read before making structural changes.

## Stack

Vanilla HTML5 Canvas + JS, split into ES modules under `js/` (see [README.md](README.md#project-layout) for the file map). No build step, no dependencies — the browser's native `import`/`export` does the module loading, which is why the game must be served over HTTP (not opened via `file://`).

## Rendering pipeline

Single `<canvas id="game" width="900" height="580">`, 2D context (`js/dom.js` owns the reference). Fixed internal resolution (900×580), scaled to fit via CSS (`aspect-ratio: 900/580`, `width:100%`). `GROUND_Y = 390` (`js/config.js`) is the one authoritative ground line constant — background, obstacles, stars, and player all key off it.

Main loop (`js/game.js`): `requestAnimationFrame(loop)` → `update(dt)` then `draw()`. `dt` is normalized to ~60fps units (dt≈1 per frame at 60fps, ~60 per real second) and clamped to 2.5 to avoid physics blowups after a tab-switch stall.

**dt-unit convention**: anything meant to represent a real-world duration (invulnerability window, screen shake, popup fade) must decrement by `dt/60`, not raw `dt`. Decrementing by raw `dt` drains what looks like a "1.6 second" timer in about 2 frames, since `dt` accumulates ~60 units per second, not 1. `player.invuln`, `shakeT`, `starPop`, and `debris[].t` all follow this. (`hitFlash` and `starPopups[].t` use their own small multipliers instead — same idea, different constant, both correct — don't "fix" them to match `dt/60`.)

## State

`js/state.js` exports `G`, a single mutable object holding all per-run data (player, obstacles, stars, debris, scrollX, score, lives, etc.) plus `PHASE`/`phase` (the READY/PLAYING/PAUSED/OVER state machine) and the HUD-update functions. Every other module imports `G` and mutates its properties directly (`G.foo = ...`); nothing keeps a parallel copy of game state.

`resetGame()` (in `state.js`) is the only place that re-initializes a run — it's called once by `startGame()` (`js/game.js`).

## Tuning & the admin panel

`js/config.js` holds default values; `js/tuning.js` re-exports the *feel*-relevant subset (gravity, jump velocity, speed ramp, min/max speed, jump speed multiplier, max lives, stars per life) as a single mutable object `TUNE`, seeded from those defaults. `game.js`/`entities.js`/`state.js` read `TUNE.xxx` — never the `config.js` constants directly — for anything that should be live-tunable. `JUMP_TOTAL_FRAMES` used to be a precomputed constant; since gravity/jump velocity can now change at runtime it's a function, `jumpTotalFrames()`, computed fresh each use.

Visiting `index.html?admin` builds a floating panel (`js/admin.js`) with a number input per `TUNE` key. Editing a field mutates `TUNE` directly — since every module imports the *same* object reference, the change is visible everywhere immediately, no reload. A few fields need an extra nudge beyond the raw mutation (changing `MAX_LIVES` has to regenerate the heart icons via `rebuildLivesUI()`; changing `BASE_SPEED_CAP`/`STARS_PER_LIFE` re-renders their HUD text) — `admin.js` calls those explicitly after each edit. Without `?admin` in the URL, `admin.js` does nothing and adds no DOM.

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

- `TUNE.GRAVITY`, `TUNE.JUMP_VELOCITY` (defaults in `js/config.js`, live-tunable — see "Tuning & the admin panel" above). `jumpTotalFrames()` (`js/tuning.js`) derives airtime as `2*|JUMP_VELOCITY|/GRAVITY` fresh each use, not hand-tuned — keep it derived if either changes, don't let it drift out of sync. Current defaults (gravity 1.0, jump velocity -15) give a 30-frame jump.
- The jump is a fixed-velocity launch — there's no variable jump height (no "hold to jump higher"). Every jump sweeps the player's height through the *entire* 0..max range, and the apex sits above every star tier — see Stars below for why that matters when tuning them.
- Speed model: `G.baseSpeed` ramps slowly with `G.elapsed` (difficulty curve, capped at `TUNE.BASE_SPEED_CAP`). Player's right/left input adds a boost/slowdown offset on top, and `G.curSpeed` eases toward the desired value rather than snapping (`curSpeed += (desired-curSpeed)*0.12*dt`) for smooth accel/decel feel. Airborne, world-scroll speed is `curSpeed * TUNE.JUMP_SPEED_MULT` (a small penalty by default, not a boost) — see `MIN_SAFE_SPEED` below for why that's still safe.
- `TUNE.MIN_SAFE_SPEED`: a jump's horizontal reach is `curSpeed * TUNE.JUMP_SPEED_MULT * jumpTotalFrames()` — below a certain speed that reach drops under the widest obstacle's width, so a correctly-timed jump can still land on top of it. `curSpeed` is never allowed to sit below this floor (game start, "slow down" input, post-hit stumble) — see `hitPlayer()` in `entities.js` and `resetGame()`/`update()`'s speed clamp in `state.js`/`game.js`. With the current defaults that's ~155px of reach against obstacles that top out around 56px wide.
- Collision uses a shrunk hitbox relative to the drawn sprite (`boxW = pDrawW*0.42`, `boxH = pDrawH*0.72`) so near-misses feel fair against the visual sprite bounds. This one box (`pLeft`/`pRight`/`pTop`/`pBot`, computed once per frame in `update()`) serves both the obstacle loop and the star loop — reuse it rather than recomputing a second player box.
- **Tunneling**: at high `curSpeed`/large `dt`, an object's screen position can jump clean past the collision window within a single frame. Obstacle collision is checked against the sprite's current bounds each frame (window is wide enough in practice); star collision is explicitly *swept* on x, testing the whole path travelled during the frame (`sx - s.r` … `sx + scrollDelta + s.r`) rather than just the frame's endpoint — see `js/game.js`'s `update()`.

## Obstacle generation & collision

Obstacle types live in one registry: `OBSTACLE_TYPES` in `js/obstacles/index.js`. Each entry declares `minScore` (score gate before the type can appear at all), `weight` (relative spawn frequency), `size()` (returns the collision box, with per-spawn jitter), `draw` (its renderer, one module per type under `js/obstacles/`), and `drawScale` (visual-only width multiplier — some art is drawn wider than its hitbox so the sprite reads well while collisions stay forgiving; it never affects physics).

`pickObstacleType(score)` filters to the types unlocked at that score and picks among them by weight, renormalized over what's unlocked — so ratios between already-available types stay fixed as new ones unlock. Current gates: crate/barrel from 0, `trashcan` from 1500, `dumpster` from 2500, `openManholeTire` from 3500, `armoredvan` from 5000.

**Sizing a new type: height is the constraint, not width.** Measured by sweeping jump-trigger distances at `START_SPEED` and counting how many produce a clean clear (a proxy for how forgiving the timing is), width barely matters in the 60–82 range — 70 and 79 score identically — while height moves the window sharply: at width 79, `h=62` gives 16 usable trigger distances, `h=70` gives 11, `h=78` gives 6. The `dumpster` (64×67) scores 16, so treat that as the "comfortable" reference and go lower only deliberately, for a late-unlocking type. Verify a candidate empirically rather than reasoning from jump reach alone: the naive `reach ≈ curSpeed × JUMP_SPEED_MULT × jumpTotalFrames()` estimate ignores that a taller box also shortens the span of the arc that sits above it, and it overestimates what's clearable.

Responsibilities stay split: `spawnObstacle()` (`js/entities.js`) only decides *when* and *where* (gap/`worldX`) and asks the registry *what*; the per-type modules only draw. Neither has an if/else over types — adding one is a new draw module plus one registry entry.

Gap shrinks slowly with `G.elapsed` but is clamped to `gapClamped >= 300` minimum — difficulty ramps without ever becoming unfair/impossible. Obstacles are world-space (`worldX`), converted to screen space at draw/collision time via `worldX - G.scrollX`; spawned ahead of the visible window, culled once far behind it.

Each obstacle can only cost one life: on overlap it's flagged `o.hit = true` and filtered out of `G.obstacles` that same frame — without this, a slowed-down player (see "stumble" below) could linger on top of the same obstacle across frames and take repeated hits.

On hit: `launchDebris()` converts the obstacle into a screen-space "debris" object (its own velocity/rotation, independent of world scroll) that flies off and fades over ~0.9s, so a collision reads as an unmistakable event rather than a silent life decrement. `hitPlayer()` decrements a life, grants `1.6`s of invulnerability with a flicker, triggers a screen shake + red flash + "-1" popup, and **stumbles the player to a dead stop** (`curSpeed = 0`, then eases back up via the normal accel curve) — deliberately, not a bug, so a hit is felt.

## Stars

`spawnStar()` (`js/entities.js`) picks a difficulty tier from `STAR_TIERS` (`js/config.js`) — each tier is a `{weight, offsetMin, offsetMax, r}` bucket: low `groundOffset` + big radius = easy/forgiving, high `groundOffset` (near the max jump height) + small radius = hard.

**Catch check.** A star is caught when its *drawn* position overlaps the player's hurtbox — the same `pLeft`/`pRight`/`pTop`/`pBot` box the obstacle loop uses, computed once in `update()` and reused. Vertically the star's screen y is recomputed exactly as `drawStar` renders it (`GROUND_Y - s.groundOffset + sin(starBobPhase(s)) * 5`), so the hitbox can never drift from what's on screen. Horizontally it's swept (`sx - s.r` … `sx + scrollDelta + s.r`) so a fast scroll can't step a star clean past the player between two frames.

This is deliberately the same question the obstacle loop asks — "do these two boxes overlap?" — so that "looks like it touched" and "counts as caught" can't disagree. An earlier version instead gated the whole check on `!G.player.onGround` and compared the star's height against a single foot-height point (`-G.player.y`, which is exactly `0` while standing). Since the sprite is 150px tall and stars hover 30–112px up, a star could sit squarely on the character's torso while the check either never ran or measured from the feet — the bug that motivated the current approach. Don't reintroduce a point-vs-star comparison; compare boxes.

**Consequence for tuning.** The hurtbox is ~108px tall measured up from the feet, and the jump apex (~113px with default gravity/jump velocity) is *above* every tier's offset range. So a standing player already overlaps all three tiers, and at the apex most stars pass below the feet — stars are now easier to collect while running than while jumping, inverting the original "only reachable mid-air" intent. That is a balance question, not a correctness one: the levers are `STAR_TIERS` offsets (push them above ~110px to require a jump) or `boxH` in `update()`. Changing the catch check itself to restore jump-only collection would re-break the visual/logical agreement described above.

Every `STARS_PER_LIFE` (10) stars collected grants +1 life, capped at `MAX_LIVES` (5). The life-icon HUD (`js/state.js`) is generated from `MAX_LIVES` at startup rather than hardcoded in HTML, so the two stay in sync if `MAX_LIVES` changes.

## Pause

`PHASE.PAUSED` (`js/state.js`). Toggled by `Escape` or the always-visible `#pauseBtn` (`js/game.js`'s `togglePause()`, wired in `js/main.js`). `update()` is a no-op whenever `phase !== PHASE.PLAYING`, so pausing just stops calling it — `draw()` keeps running every frame so the pause overlay renders. Pausing clears any in-flight input (`clearInput()` in `js/input.js`) so a held key or a queued jump doesn't fire the instant the game resumes.

## Global leaderboard

Backed by Supabase (`js/leaderboard.js`): public REST + anon key, client-side. **Data integrity comes from the `scores` table's own CHECK constraints** (score range, name length) — the RLS insert policy itself permits any row shape, so don't assume RLS alone bounds submitted data; add a matching CHECK constraint for any new submitted field. `fetchLeaderboard`/`submitScoreToLeaderboard` are thin `fetch()` wrappers; failures degrade gracefully to a "couldn't reach leaderboard" message rather than blocking gameplay. Name is uppercased, capped at 12 chars, remembered in `localStorage` for next run. Rendered rows coerce `score` to a number and escape `player_name` before touching `innerHTML`.

## Failure philosophy

Every external asset/network dependency (spritesheet, both background images, leaderboard fetch) has a fallback path so a slow network or blocked asset degrades the experience rather than breaking the game. An inline (non-module) `window.onerror` handler in `index.html` — registered before any module script runs, so it can catch module load/parse failures too — surfaces any uncaught script error as a visible on-canvas banner instead of failing silently.

## Extending

- New animation: add a row to the spritesheet PNG + entry in `SHEET.anims` (`js/config.js`). No other code changes needed.
- New obstacle type: write `js/obstacles/<type>.js` exporting a `drawX(x, w, h)` (world→screen `x` already resolved by caller, size params only — follow `crate.js`/`barrel.js`, and reuse `utils.js` for `roundRect`/ground shadow), then add one entry to `OBSTACLE_TYPES` in `js/obstacles/index.js` with its `minScore`, `weight`, `size()`, `draw`, and `drawScale`. Nothing in `entities.js` or `render.js` needs to change — an obstacle file that isn't registered is dead code, never spawned. If it should fly apart on hit, add a matching branch to `drawDebrisPiece()` (`js/render.js`), which is still per-type.
- New star tier or difficulty curve: add/adjust an entry in `STAR_TIERS` (`js/config.js`) — no code changes needed elsewhere. Note the catch check is body-overlap based, so offsets below ~110px are collectable without jumping; see Stars.
- Tuning difficulty/feel: prefer adjusting the existing derived constants (`baseSpeed` ramp, `gap` formula, `GRAVITY`/`JUMP_VELOCITY`) over adding new special-case branches.
