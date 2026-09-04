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

A run moves through a list of city photos, none of them seamlessly tileable on its own. The list is `BACKGROUNDS` in `js/config.js` — `{ src, minScore, roadSrcY }` per stage, sorted ascending; the last entry whose `minScore` the player has passed wins (`backgroundIndexForScore()`). Today: the daytime skyline from 0, a second city photo from 4000, and a sunset over the eastern hills from 5000. Adding scenery is adding an entry plus the file — the renderer has no per-photo branch. Two tricks make any of them work as an infinite scroller:

1. **Ground alignment**: each photo carries its own `roadSrcY` — the source-image pixel row where the curb meets the road — scaled so it lands exactly on `GROUND_Y`. One scale factor (`GROUND_Y / roadSrcY`) drives both `dw`/`dh` and the vertical offset, which is what lets photos of different sizes and framing share a ground line. Measure it from the image itself (the row where the bright sidewalk band ends and the dark road begins), don't estimate it.
2. **Lazy loading**: backgrounds are a few hundred KB each and most runs never reach the later ones, so `assets.js` only fetches one when the renderer asks for it. `drawBackground()` requests the stage it is about to draw *and* the next one once the score is within `BG_PRELOAD_LEAD` (800, roughly ten seconds of running) of its `minScore`, so the swap never pops in late. Requesting the current stage matters as much as the preload: a run can arrive at a stage without passing through its preload window, and an unrequested photo never loads at all — the sky silently falls back to a flat gradient.
3. **Mirror tiling**: every other repeat is drawn mirrored (`ctx.scale(-1,1)`), so the shared edge between tiles always matches itself pixel-for-pixel — no visible seam, even though the source art isn't tileable. Trade-off: on mirrored tiles the "TALLER" signage reads backwards. Accepted, not a bug.

Background scrolls at `parallax = 0.55` of world speed for depth. Foreground (obstacles, stars, ground ticks, player) scrolls at full `G.scrollX`.

## Physics / feel

- `TUNE.GRAVITY`, `TUNE.JUMP_VELOCITY` (defaults in `js/config.js`, live-tunable — see "Tuning & the admin panel" above). `jumpTotalFrames()` (`js/tuning.js`) derives airtime as `2*|JUMP_VELOCITY|/GRAVITY` fresh each use, not hand-tuned — keep it derived if either changes, don't let it drift out of sync. Current defaults (gravity 1.0, jump velocity -15) give a 30-frame jump.
- The jump is a fixed-velocity launch — there's no variable jump height (no "hold to jump higher"). Every jump sweeps the player's height through the *entire* 0..max range, and the apex sits above every star tier — see Stars below for why that matters when tuning them.
- Speed model: `G.baseSpeed` ramps slowly with `G.elapsed` (difficulty curve, capped at `TUNE.BASE_SPEED_CAP`). Player's right/left input adds a boost/slowdown offset on top, and `G.curSpeed` eases toward the desired value rather than snapping (`curSpeed += (desired-curSpeed)*0.12*dt`) for smooth accel/decel feel. Airborne, world-scroll speed is `curSpeed * TUNE.JUMP_SPEED_MULT` (a small penalty by default, not a boost) — see `MIN_SAFE_SPEED` below for why that's still safe.
- `TUNE.MIN_SAFE_SPEED`: a jump's horizontal reach is `curSpeed * TUNE.JUMP_SPEED_MULT * jumpTotalFrames()` — below a certain speed that reach drops under the widest obstacle's width, so a correctly-timed jump can still land on top of it. `curSpeed` is never allowed to sit below this floor (game start, "slow down" input, post-hit stumble) — see `hitPlayer()` in `entities.js` and `resetGame()`/`update()`'s speed clamp in `state.js`/`game.js`. With the current defaults that's ~155px of reach against obstacles that top out around 56px wide.
- Collision uses a shrunk hitbox relative to the drawn sprite (`boxW = pDrawW*0.42`, `boxH = pDrawH*0.72`) so near-misses feel fair against the visual sprite bounds. This one box (`pLeft`/`pRight`/`pTop`/`pBot`, computed once per frame in `update()`) serves both the obstacle loop and the star loop — reuse it rather than recomputing a second player box.
- **Tunneling**: at high `curSpeed`/large `dt`, an object's screen position can jump clean past the collision window within a single frame. Obstacle collision is checked against the sprite's current bounds each frame (window is wide enough in practice); star collision is explicitly *swept* on x, testing the whole path travelled during the frame (`sx - s.r` … `sx + scrollDelta + s.r`) rather than just the frame's endpoint — see `js/game.js`'s `update()`.

## Obstacle generation & collision

Obstacle types live in one registry: `OBSTACLE_TYPES` in `js/obstacles/index.js`. Each entry declares either `minScore` (score gate before the type can appear at all) plus `weight` (relative spawn frequency), or `everyPoints` (a fixed schedule — see below), `size()` (returns the collision box, with per-spawn jitter), either `draw` (its renderer, one module per type under `js/obstacles/`) or `image` (a path to a picture — see Extending), and `drawScale` (visual-only width multiplier — some art is drawn wider than its hitbox so the sprite reads well while collisions stay forgiving; it never affects physics).

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

**Cost of drawing.** Spawning allocates nothing but `{worldX, type, w, h}` — no art is produced at spawn time. The art is painted every frame instead, for the 2–3 obstacles on screen, which measures at 0.05ms per frame on average (0.3% of a 60fps budget). Code-drawn obstacles cost 3–40µs each to paint; an image blits in ~1µs. (The trashcan used to be a ~230µs outlier because it filled 35 sub-pixel circles through 35 separate `beginPath`/`fill` calls — now it draws fewer, visible holes as a single `Path2D`, at ~39µs.) Both are far below the point where it matters, so choose between them on how easy the obstacle is to author, not on speed.

**Debris is per-obstacle behaviour, not one rule.** Most obstacles are launched by `launchDebris()` and spin off screen — the hit reads as an event. Anything bolted to the pavement declares `shatters` in the registry instead (a rectangle, in sprite fractions, marking the glass): `launchGlass()` throws ~14 shards from that rectangle, the obstacle is flagged `wrecked` and stays standing while `drawEmptyFrame()` blacks out the panel. A wrecked obstacle keeps its `hit` flag, so the overlap test skips it and it cannot cost a second life — which is why the cull in `update()` is `!o.hit || o.wrecked` rather than `!o.hit`; dropping the `|| o.wrecked` would make the shelter vanish on impact again.

**Scheduled types (`everyPoints`).** A type declaring `everyPoints: N` is never picked by the weighted draw — `pickObstacleType()` filters it out — and instead appears exactly once every N points, decided by `dueMilestoneType()` against `G.milestones` (type -> last milestone already spawned, cleared by `resetGame()`). This exists because the hardest obstacles need to be punctual: left in the weighted pool, the dice can throw two in a row, which reads as unfair rather than difficult. Obstacles spawn about a screen ahead of the player, so a milestone obstacle is *reached* a little after the score that triggered it — the spawn scores land a few points past each multiple (1008, 2004, 3000, …), which is the intended behaviour, not drift to be corrected.

**Bus shelter (`paradero`).** The first obstacle built from a picture rather than a draw function, and the template for the next ones: a transparent WebP in `images/obstacles/` plus a registry entry with `image:`. It is also the first whose hitbox is deliberately *not* the drawn rectangle. The art is 1.818 wide for 1 tall, so drawing the shelter twice as tall (about 190x105 instead of 95x52) also draws it twice as wide — and a hitbox that size cannot be jumped: measured at `START_SPEED`, a 95-wide box has 10 of 33 usable trigger distances at h=52, 4 at h=70, and 0 from h=75 up, while the jump apex is 112.5px, so no width at all clears h>=95. The shelter therefore keeps a narrow, tall hitbox (48-50 x 76-79, 10-11/33 across its whole jitter range — the same difficulty as the 95x52 box it replaces) and draws at `drawScale: 3.85`, letting the canopy overhang and the open sides pass through. Because the two rectangles have parted ways, anything that reasons about the *picture* — the `shatters` panel — must go through `panelRect()`, which derives the drawn height from `drawW` and the entry's `aspect`; deriving it from `o.h` puts the glass somewhere else entirely. Being the hardest type, it is scheduled rather than rolled: `everyPoints: 1000`, one shelter per 1000 points.

**Restarting is click-only from game over.** The ready screen starts on Space/Enter/ArrowUp, the game-over screen does not — only the TRY AGAIN button restarts from there. On that screen the run's score is sitting unsubmitted beside the name field, and the same Space that meant "jump" for the whole run would discard it before it was ever saved; a player reported losing good scores exactly this way. The canvas `pointerdown` handler leaves game over out for the same reason. Don't add a keyboard shortcut back to `startGame()` from `PHASE.OVER` — see `js/main.js`.

## Engine vs. game pack

The code is in two halves. The **engine** — everything directly under `js/` — knows about running, jumping, spawning, colliding, scoring and drawing a scene. The **game pack** — `js/games/<id>/` — knows that this particular game is set in Bogotá: the spritesheet, the scenery photos, the obstacle table, the collectible's shape, the road's colours, the audio files, the game-over copy, the numbers that set how it feels. `js/active-game.js` picks which pack is live, and is deliberately one line.

The rule that keeps it honest, and the one to enforce in review: **the engine imports the game, never the reverse.** No file under `js/` outside `js/games/` may name a sprite, a sound, a colour, or a line of copy. `js/config.js` is the seam — it re-exports `GAME`'s values under the stable names the engine already used (`GROUND_Y`, `SHEET`, `BACKGROUNDS`, …), which is why the split cost almost no churn in the modules that consume them.

Two places deserve their own note:

- **The obstacle registry split in half.** `js/obstacles/index.js` kept the mechanics — the weighted draw, the `everyPoints` schedule, `drawObstacle`, `panelRect` — and now reads whatever table the active game supplies. The table itself, with its per-type tuning comments and measured jump windows, moved to `js/games/bogota/obstacles/`. The mechanics never enumerate type names, so a game with vines and skate rails reuses them untouched.
- **`render.js` kept the scene, not the art.** It still decides what is drawn, where, and in what order; the collectible, the debris pieces, the vector stand-in runner and the road's palette come from `GAME.art`. The engine calls the collectible a "star" because that is its role — another game can draw a banana there as long as it fills the same radius.

**A game may ship no art at all.** `backgrounds` is allowed to be empty and the spritesheet path is allowed not to resolve; the renderer then paints `GAME.art.fallbackScenery` and `GAME.art.fallbackRunner` instead. That path used to be Bogotá-specific — the engine drew a blocky skyline itself — which was exactly the kind of leak the split is meant to remove; the skyline now lives in Bogotá's `art.js` and the jungle draws a canopy through the same hook. It also means a new pack is playable on day one and art arrives one file at a time. `js/games/jungle/` is that case in practice, and doubles as the test that the engine really is game-agnostic.

`storagePrefix` is worth care: it prefixes every `localStorage` key (best score, player name, mute). Bogotá's stays `"ragnar"` because that is what players' saved best scores are already filed under — renaming it would silently reset every existing player. A second game must pick a different one, or the two will overwrite each other on the same origin.

**All copy lives in one JSON file.** `GAME.strings` points at `strings.json` in the pack; `js/strings.js` fetches it once at startup and exposes `t(key, vars)` plus `applyStrings()`, which fills every `[data-text]` element and `data-text-<attribute>` in the markup. So the HTML ships keys, not words, and changing any text is editing one file with no JavaScript and no rebuild.

Details worth keeping:

- It is fetched, not imported. JSON modules still need import attributes that not every target browser supports, and a fetch also means the copy can be corrected on a deployed site directly — there is no build step to undo.
- `main.js` does the load in a **top-level await** before anything else runs, because every line below it may render text. The markup is empty until that resolves, which is why a failure is surfaced in the error banner and rethrown rather than swallowed: a silent failure here would leave a wordless page.
- Text is written with `textContent`, never `innerHTML`. That is why headings are split into two spans (`start.titleLead` + `start.titleAccent`) instead of embedding a `<span>` in the JSON — copy is data, and data never becomes markup.
- `js/theme.js` receives `t` as an argument instead of importing it. That module is loaded from `<head>` and **must stay dependency-free**: importing `js/strings.js` would pull the whole graph — including `js/dom.js`, which grabs the canvas and its 2D context — into a point in the parse where the canvas does not exist yet.
- The `<title>` and the `<meta>`/Open Graph description deliberately stay in the HTML. Crawlers and link unfurlers read them before any script runs; moving them into JSON would break the site's search listing and its share previews to buy nothing.

What is *not* engine-driven, by choice: the CSS palette, `manifest.json`, and the service worker's cache name. Those are the shell around the canvas, they are edited by hand per game, and pushing them through a config object would buy nothing but indirection.

## Seasonal themes

The interface reskins itself by month: September is *amor y amistad* (pinks over plum), October is Halloween (pumpkin orange over near-black purple), December is Navidad (gold over pine green). Every other month uses the default palette.

`js/theme.js` is the only place that knows which month maps to which theme; it stamps `data-theme` on `<html>` and nothing else. The palettes live in `css/style.css` as `:root[data-theme="..."]` blocks that override *only* CSS custom properties — never layout — so an unknown or missing theme silently falls back to the default `:root` and the interface cannot break out of season. That is also why the shell's colours (page backdrop, plate gradients, stage frame, button drop shadows, rules) are tokens (`--panel-hi`, `--edge`, `--stage-bg`, …) rather than inline hex: a colour written inline is a colour a theme cannot repaint. The accent is duplicated as `--amber-rgb` because several rules need it at partial alpha and `rgba()` cannot take a hex variable.

The script is loaded from `<head>` next to the stylesheet rather than imported by `main.js`, so the palette is applied before the first paint instead of flashing the default one. `?theme=halloween` (or `amistad` / `navidad`) forces a theme for review out of season.

The start screen names the month in a badge ("🎃 October Edition · Halloween"), because a player who opens the game and finds it pink or orange should not have to guess why. `renderSeasonBadge()` fills it from `main.js` — not at import time, since the module runs from `<head>` and the start screen does not exist yet — and leaves it hidden in months with no theme. The label follows the *theme*, not the clock: with `?theme=halloween` forced in September the badge has to say October, or it explains the wrong thing.

The month table in `js/theme.js` is keyed by theme and holds everything about it — the triggering month, the glyph, the badge text — so adding or retiring a season is one entry, not edits scattered across three files.

**Inside the canvas.** `js/seasonal.js` is the world-side counterpart, reading the same `activeTheme()` so the chrome and the game can never disagree about the month. It contributes three things to `render.js`: a colour wash, sky props, and foreground particles — a moon and bats in October, rising hearts in September, falling snow in December. The wash is drawn straight after the background so it tints the scenery, and *before* the obstacles so it never dulls the things the player has to read; the particles are drawn late, in front of the runner, because the depth only works if they occlude.

This layer is procedural rather than art. A seasonal photographic set would be one ~150-450KB background per month per stage, mostly never seen, and it would collide with the score-driven progression in `BACKGROUNDS` — a December run past 5000 points can only have one background. An overlay composites onto whichever stage is current, so the two systems stay independent.

It also holds no state. Particle positions are derived from `performance.now()` and a seed table built once at load, so there is nothing to update, nothing to reset between runs, and no per-frame allocation in the draw path. If you add a theme, add its wash/props here and its palette in the CSS — don't branch on the theme name anywhere else.

## Extending

- New animation: add a row to the spritesheet PNG + entry in `SHEET.anims` (`js/config.js`). No other code changes needed.
- New obstacle type, **from a picture** (the easy path): drop a transparent PNG/WebP in `images/obstacles/` and add one entry to `OBSTACLE_TYPES` with `image: 'images/obstacles/<name>.webp'` instead of `draw`. The picture's width is the hitbox width times `drawScale`; its height follows the image's own proportions, so art is never stretched, and it is bottom-aligned to `GROUND_Y`. The hitbox from `size()` stays the gameplay truth — the drawing never affects collision. Images are decoded once at startup and blitted (~1µs) rather than re-painted; a missing or slow image falls back to a plain block the size of the hitbox, because an invisible obstacle still costs a life.
- New obstacle type, **drawn in code**: write `js/obstacles/<type>.js` exporting a `drawX(x, w, h)` (world→screen `x` already resolved by caller, size params only — follow `crate.js`/`barrel.js`, and reuse `utils.js` for `roundRect`/ground shadow), then add one entry to `OBSTACLE_TYPES` in `js/obstacles/index.js` with its `minScore`, `weight`, `size()`, `draw`, and `drawScale`. Nothing in `entities.js` or `render.js` needs to change — an obstacle file that isn't registered is dead code, never spawned. If it should fly apart on hit, add a matching branch to `drawDebrisPiece()` (`js/render.js`), which is still per-type.
- New star tier or difficulty curve: add/adjust an entry in `STAR_TIERS` (`js/config.js`) — no code changes needed elsewhere. Note the catch check is body-overlap based, so offsets below ~110px are collectable without jumping; see Stars.
- Tuning difficulty/feel: prefer adjusting the existing derived constants (`baseSpeed` ramp, `gap` formula, `GRAVITY`/`JUMP_VELOCITY`) over adding new special-case branches.
