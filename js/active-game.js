// Which game the engine runs. Both packs are imported statically — they are a
// few KB of code each and load no assets by themselves — and the page picks
// one, so nothing downstream has to deal with an asynchronous GAME.
//
// The page declares its game on the root element (`<html data-game="jungle">`)
// because that attribute exists before any script runs, which matters: the
// engine reads GAME during module evaluation. Anything else — a global set by
// an inline script, a query parameter — would work too, but this is the same
// trick js/theme.js already uses for data-theme.
//
// A page with no attribute, or an unknown one, gets Bogotá. There is no
// sensible "no game" state, and a typo in a URL should still be playable.
import { GAME as BOGOTA } from './games/bogota/index.js';
import { GAME as JUNGLE } from './games/jungle/index.js';

const GAMES = {
  bogota: BOGOTA,
  jungle: JUNGLE,
};

export const GAME = GAMES[document.documentElement.dataset.game] || BOGOTA;
