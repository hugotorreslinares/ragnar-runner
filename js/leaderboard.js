// Global leaderboard (Supabase). Public anon key — safe to expose
// client-side; the table's own CHECK constraints (score range, name length)
// are what actually bound the data, not key secrecy or the RLS insert
// policy (which allows any row shape).
import { lbNameInput, lbSubmitBtn, lbOverList, lbStartList } from './dom.js';

import { GAME } from './active-game.js';

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, table: TABLE } = GAME.leaderboard;

function lbHeaders(extra){
  return Object.assign({
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
  }, extra || {});
}

async function fetchLeaderboard(limit){
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/' + TABLE + '?select=player_name,score&order=score.desc&limit=' + limit,
    { headers: lbHeaders() }
  );
  if (!res.ok) throw new Error('leaderboard fetch failed: ' + res.status);
  return res.json();
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
    container.innerHTML = '<div class="lb-status">No scores yet — be the first.</div>';
    return;
  }
  container.innerHTML = rows.map((r, i) => {
    const safeScore = Number.isFinite(Number(r.score)) ? Number(r.score) : 0;
    return '<div class="lb-row">' +
      '<span class="lb-rank">' + (i+1) + '</span>' +
      '<span class="lb-name">' + escapeHtml(r.player_name || 'ANON') + '</span>' +
      '<span class="lb-score">' + safeScore + '</span>' +
    '</div>';
  }).join('');
}

export function loadLeaderboardInto(container, limit){
  container.innerHTML = '<div class="lb-status">Loading…</div>';
  fetchLeaderboard(limit)
    .then(rows => renderLeaderboard(container, rows))
    .catch(() => { container.innerHTML = '<div class="lb-status">Couldn\'t reach the leaderboard.</div>'; });
}

// ---------- Submit-score UI flow ----------
let scoreSubmitted = false;

export function resetSubmitUI(){
  scoreSubmitted = false;
  lbSubmitBtn.disabled = false;
  lbSubmitBtn.textContent = 'Submit Score';
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
  lbSubmitBtn.textContent = 'Submitting…';
  try {
    await submitScoreToLeaderboard(name, score);
    lbSubmitBtn.textContent = 'Submitted ✓';
    loadLeaderboardInto(lbOverList, 20);
    loadLeaderboardInto(lbStartList, 5);
  } catch(e){
    lbSubmitBtn.textContent = 'Couldn\'t submit — retry';
    scoreSubmitted = false;
    lbSubmitBtn.disabled = false;
  }
}
