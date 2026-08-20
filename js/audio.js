// All sound. Owns the music, the hit sound, and the mute preference; every
// other module goes through the exported functions.
//
// The music runs through Web Audio rather than an <audio loop> element, for
// one reason: <audio loop> is not gapless. Measured in Chromium on this very
// track, wrapping from the end back to the start cost ~75ms of silence on
// top of normal playback drift — a hiccup every 32 seconds, which is exactly
// the kind of thing you stop hearing as music and start hearing as a bug.
// An AudioBufferSourceNode loops sample-accurately instead.
//
// Nothing starts until startMusic()/playHit(), both reached from a real user
// gesture (Start button/keypress). Browsers block audio without one.
const MUSIC = 'audio/funky-sidewalk-loop';
const HIT = 'audio/hit';
const MUTE_KEY = 'ragnarMuted';

// The track is a purpose-built 32.000 s loop: 120.00 BPM, exactly 16 bars.
// This has to be stated rather than taken from buffer.duration, because
// decoding adds codec padding — Vorbis decodes to 32.016 s here, and looping
// on that would play 16ms of encoder tail before wrapping.
const MUSIC_LOOP_SECONDS = 32;

const MUSIC_VOLUME = 0.45;
const HIT_VOLUME = 0.7;

// Two encodings of each clip — the browser fetches whichever it can decode,
// never both. Ogg Vorbis is unsupported on older Safari/iOS; those get AAC.
const canOgg = !!new Audio().canPlayType('audio/ogg');
const url = base => base + (canOgg ? '.ogg' : '.m4a');

let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

let ctx = null;
let masterGain = null;
let musicBuffer = null;
let hitBuffer = null;
let musicSource = null;   // non-null only while the music is running
let musicWanted = false;  // whether the music *should* be playing right now

// Created on demand so no AudioContext exists until the player acts — one
// made at load time would start suspended and count against autoplay policy.
function audio(){
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 1;
  masterGain.connect(ctx.destination);
  return ctx;
}

async function load(base){
  const c = audio();
  if (!c) return null;
  const res = await fetch(url(base));
  if (!res.ok) throw new Error('audio fetch failed: ' + res.status);
  return await c.decodeAudioData(await res.arrayBuffer());
}

// Decoding needs an AudioContext, which needs a gesture, so the fetch is all
// that can be warmed ahead of time. It runs from an idle callback after
// window load so ~340KB of music never competes with first paint.
function warm(){
  fetch(url(MUSIC)).catch(() => {});
  fetch(url(HIT)).catch(() => {});
}
function queueWarm(){
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 3000 });
  else setTimeout(warm, 1200);
}
if (document.readyState === 'complete') queueWarm();
else window.addEventListener('load', queueWarm, { once: true });

function play(buffer, gainValue, loop){
  const c = audio();
  if (!c || !buffer) return null;
  const src = c.createBufferSource();
  src.buffer = buffer;
  if (loop){
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = MUSIC_LOOP_SECONDS; // ignore the decoder's padding
  }
  const g = c.createGain();
  g.gain.value = gainValue;
  src.connect(g).connect(masterGain);
  src.start();
  return src;
}

export function isMuted(){ return muted; }

// Every run starts the track from the top.
export function startMusic(){
  const c = audio();
  if (!c) return;
  musicWanted = true;
  c.resume?.();
  // Decode the hit sound now, while there is a context and time to spare —
  // decoding it on the first collision instead would make that first hit,
  // and only that one, silent.
  if (!hitBuffer) load(HIT).then(buf => { hitBuffer = buf; }).catch(() => {});
  stopSource();
  if (musicBuffer){
    musicSource = play(musicBuffer, MUSIC_VOLUME, true);
    return;
  }
  load(MUSIC).then(buf => {
    musicBuffer = buf;
    // The player may have died or paused during the load — only start if the
    // music is still wanted, or a finished run would suddenly get a soundtrack.
    if (musicWanted && !musicSource) musicSource = play(musicBuffer, MUSIC_VOLUME, true);
  }).catch(() => {});
}

function stopSource(){
  if (!musicSource) return;
  try { musicSource.stop(); } catch (e) {}
  musicSource = null;
}

export function stopMusic(){
  musicWanted = false;
  stopSource();
}

// Suspending the context freezes playback in place, so resuming picks the
// track up exactly where it stopped instead of restarting the loop.
export function pauseMusic(){
  if (ctx) ctx.suspend?.();
}

export function resumeMusic(){
  if (ctx) ctx.resume?.();
}

export function playHit(){
  const c = audio();
  if (!c) return;
  c.resume?.();
  if (hitBuffer){
    play(hitBuffer, HIT_VOLUME, false); // a fresh node each time, so rapid hits overlap
    return;
  }
  load(HIT).then(buf => { hitBuffer = buf; }).catch(() => {});
}

export function toggleMute(){
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
  return muted;
}
