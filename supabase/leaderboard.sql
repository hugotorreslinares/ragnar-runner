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

-- ---------------------------------------------------------------------------
-- Analytics (js/analytics.js)
-- ---------------------------------------------------------------------------
-- One row per finished run. Insert-only for the public key: NO select policy,
-- so the published key can append a data point but never read the analytics
-- back (reads happen through the service role / SQL). Non-personal: `visitor`
-- is a random localStorage id, not an account or an IP.
create table if not exists public.plays (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  game        text        not null,
  score       integer     not null,
  run_index   integer     not null default 1,
  visitor     text        not null,
  constraint plays_game_len    check (char_length(game) between 1 and 20),
  constraint plays_score_rng   check (score between 0 and 200000),
  constraint plays_run_rng     check (run_index between 1 and 100000),
  constraint plays_visitor_len check (char_length(visitor) between 1 and 40)
);
create index if not exists plays_created_idx on public.plays (created_at desc);
create index if not exists plays_visitor_idx on public.plays (visitor);
alter table public.plays enable row level security;
create policy "public insert" on public.plays for insert to anon with check (true);
