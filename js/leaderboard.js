// Global leaderboard (Supabase). Public anon key — safe to expose
// client-side; the table's own CHECK constraints (score range, name length)
// are what actually bound the data, not key secrecy or the RLS insert
// policy (which allows any row shape).
import { lbNameInput, lbSubmitBtn, lbOverList, lbStartList } from './dom.js';

import { GAME } from './active-game.js';
import { t } from './strings.js';

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, table: TABLE } = GAME.leaderboard;

function lbHeaders(extra){
  return Object.assign({
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
  }, extra || {});
}

// One row per player, not per run. Every run is stored, so a regular ends up
// occupying several of the top slots and the board reads as three people
// playing instead of a competition — the top 20 was 11 players before this.
//
// Done here rather than in SQL because the fix would need a DISTINCT ON view,
// and a view with DISTINCT ON is not insertable: the game would then need one
// name to read from and another to write to, in every game pack. Overfetching
// a few rows is cheaper than that.
//
// ponytail: a player with more than OVERFETCH x limit entries ahead of
// everyone else could still crowd the board. Move it to a view if that ever
// stops being hypothetical.
const OVERFETCH = 10;
const MAX_ROWS = 200;

async function fetchLeaderboard(limit){
  const rows = Math.min(limit * OVERFETCH, MAX_ROWS);
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/' + TABLE + '?select=player_name,score&order=score.desc&limit=' + rows,
    { headers: lbHeaders() }
  );
  if (!res.ok) throw new Error('leaderboard fetch failed: ' + res.status);
  return bestPerPlayer(await res.json(), limit);
}

// Rows arrive sorted by score descending, so the first time a name appears is
// already that player's best run — no comparison needed.
function bestPerPlayer(rows, limit){
  const best = new Map();
  for (const row of rows){
    if (!best.has(row.player_name)) best.set(row.player_name, row);
    if (best.size === limit) break;
  }
  return [...best.values()];
}

export async function submitScoreToLeaderboard(name, score){
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + TABLE, {
    method: 'POST',
    headers: lbHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify({ player_name: name, score: score }),
  });
  if (!res.ok) throw new Error('leaderboard submit failed: ' + res.status);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderLeaderboard(container, rows){
  if (!rows || rows.length === 0){
    container.innerHTML = '<div class="lb-status">' + escapeHtml(t('leaderboard.empty')) + '</div>';
    return;
  }
  container.innerHTML = rows.map((r, i) => {
    const safeScore = Number.isFinite(Number(r.score)) ? Number(r.score) : 0;
    return '<div class="lb-row">' +
      '<span class="lb-rank">' + (i+1) + '</span>' +
      '<span class="lb-name">' + escapeHtml(r.player_name || t('leaderboard.anonymous')) + '</span>' +
      '<span class="lb-score">' + safeScore + '</span>' +
    '</div>';
  }).join('');
}

export function loadLeaderboardInto(container, limit){
  container.innerHTML = '<div class="lb-status">' + escapeHtml(t('leaderboard.loading')) + '</div>';
  fetchLeaderboard(limit)
    .then(rows => renderLeaderboard(container, rows))
    .catch(() => { container.innerHTML = '<div class="lb-status">' + escapeHtml(t('leaderboard.unreachable')) + '</div>'; });
}

// ---------- Submit-score UI flow ----------
let scoreSubmitted = false;

export function resetSubmitUI(){
  scoreSubmitted = false;
  lbSubmitBtn.disabled = false;
  lbSubmitBtn.textContent = t('leaderboard.submitButton');
}

export async function handleSubmitScore(score){
  if (scoreSubmitted) return;
  let name = (lbNameInput.value || '').trim().toUpperCase();
  if (!name) name = 'ANON';
  name = name.slice(0, 12);
  lbNameInput.value = name;
  try { localStorage.setItem(GAME.storagePrefix + 'Name', name); } catch(e){}

  scoreSubmitted = true;
  lbSubmitBtn.disabled = true;
  lbSubmitBtn.textContent = t('leaderboard.submitting');
  try {
    await submitScoreToLeaderboard(name, score);
    lbSubmitBtn.textContent = t('leaderboard.submitted');
    loadLeaderboardInto(lbOverList, 20);
    loadLeaderboardInto(lbStartList, 5);
  } catch(e){
    lbSubmitBtn.textContent = t('leaderboard.submitFailed');
    scoreSubmitted = false;
    lbSubmitBtn.disabled = false;
  }
}
