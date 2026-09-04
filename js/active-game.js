// Which game the engine is running. This is the whole switch: point it at
// another folder under js/games/ and every module below follows, because
// nothing else in the engine names a game.
//
// The HTML shell (index.html copy, manifest.json, the CSS palette) is the
// other half of a game's identity and is swapped by hand — it is markup, not
// something the engine reads.
export { GAME } from "./games/bogota/index.js";
