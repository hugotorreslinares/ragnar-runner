// Measuring whether the game is worth growing, before growing it. One row per
// finished run goes to the shared Supabase project (table `plays`); retention
// and engagement are derived from that table in SQL, so nothing clever runs
// here.
//
// Design rules:
//   - Fire-and-forget. Analytics must never block a run or throw into game
//     code: every failure (offline, blocked storage, CORS) is swallowed. A
//     missing data point is far cheaper than a broken game.
//   - Non-personal. The only identifier is a random per-browser string in
//     localStorage — no account, no IP, no fingerprint. It exists so two runs
//     from the same browser can be counted as one player across days.
//   - Insert-only. The table has no select policy for the public key, so this
//     can append but never read analytics back.
import { GAME } from './active-game.js';

const { url, anonKey } = GAME.leaderboard; // same project as the leaderboards

function visitorId(){
  try {
    let id = localStorage.getItem('eb_visitor');
    if (!id){
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('eb_visitor', id);
    }
    return id.slice(0, 40);
  } catch (e) {
    return 'nostore';
  }
}

// Runs so far in this tab's session. sessionStorage resets per tab, so the max
// value a visitor reaches in a day approximates runs-per-session.
function nextRunIndex(){
  try {
    const n = (parseInt(sessionStorage.getItem('eb_runs') || '0', 10) || 0) + 1;
    sessionStorage.setItem('eb_runs', String(n));
    return Math.min(n, 100000);
  } catch (e) {
    return 1;
  }
}

export function recordPlay(score){
  const body = {
    game: GAME.id,
    score: Math.max(0, Math.min(200000, Math.floor(score) || 0)),
    run_index: nextRunIndex(),
    visitor: visitorId(),
  };
  try {
    fetch(url + '/rest/v1/plays', {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
      // Let the insert finish even if the tab navigates away right after a run.
      keepalive: true,
    }).catch(() => {});
  } catch (e) {}
}
