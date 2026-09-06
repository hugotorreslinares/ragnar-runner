-- Leaderboard schema, for reference and for rebuilding the project from
-- scratch. The live database is the source of truth; this file exists so the
-- shape it depends on is not knowledge that lives only in a dashboard.
--
-- One table per game. GAME.leaderboard.table (js/games/<id>/index.js) picks
-- which one a build talks to, so the boards stay independent: separate
-- top-Ns, and a schema change to one cannot disturb the other.
--
-- The anon/publishable key is public by design (see js/leaderboard.js). What
-- actually bounds the data is the CHECK constraints below — the insert policy
-- accepts any row shape. Any new submitted field needs its own CHECK; RLS
-- will not do it for you. There is deliberately no update or delete policy, so
-- a published key can add to a board but never edit or erase it.

-- ---------------------------------------------------------------------------
-- Escape from Bogotá
-- ---------------------------------------------------------------------------
-- Transcribed from the live table. It carries two overlapping pairs of checks
-- from earlier iterations — the effective limits are the tighter of each pair,
-- name 1-12 and score 0-200000, which is what the jungle table states once.
create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  player_name text        not null default 'ANON',
  score       integer     not null,
  created_at  timestamptz not null default now(),
  constraint player_name_len     check (char_length(player_name) between 1 and 12),
  constraint scores_name_length  check (char_length(player_name) between 1 and 20),
  constraint score_range         check (score between 0 and 1000000),
  constraint scores_score_range  check (score between 0 and 200000)
);
create index if not exists scores_score_idx on public.scores (score desc);
alter table public.scores enable row level security;
create policy "public read"   on public.scores for select to anon using (true);
create policy "public insert" on public.scores for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- Kong Run (js/games/jungle)
-- ---------------------------------------------------------------------------
create table if not exists public.jungle_scores (
  id          bigint generated always as identity primary key,
  player_name text        not null default 'ANON',
  score       integer     not null,
  created_at  timestamptz not null default now(),
  -- 12 characters is the maxlength of the name input in the markup.
  constraint jungle_scores_name_length check (char_length(player_name) between 1 and 12),
  -- Same ceiling as the Bogotá board; both games share the engine's scoring.
  constraint jungle_scores_score_range check (score between 0 and 200000)
);

-- Every read is "top N by score", so the index carries the ordering.
create index if not exists jungle_scores_score_idx on public.jungle_scores (score desc);

alter table public.jungle_scores enable row level security;

create policy "public read"   on public.jungle_scores for select to anon using (true);
create policy "public insert" on public.jungle_scores for insert to anon with check (true);
