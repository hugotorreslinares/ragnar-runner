-- Retention & engagement read-outs over public.plays. Run these against the
-- database (Supabase SQL editor or the service role) — the public key cannot
-- read this table. Nothing here is wired into the app; it is the answer to
-- "is the game worth growing yet?".

-- Headline: players, runs, runs per player, and how far a typical run gets.
select
  count(*)                                   as runs,
  count(distinct visitor)                    as players,
  round(count(*)::numeric / nullif(count(distinct visitor), 0), 1) as runs_per_player,
  round(avg(score))                          as avg_score,
  percentile_cont(0.5) within group (order by score)  as median_score,
  percentile_cont(0.9) within group (order by score)  as p90_score,
  max(score)                                 as best_score
from public.plays;

-- The retention question that matters: of players who first showed up on a
-- given day, how many came back on any later calendar day?
with firsts as (
  select visitor, min(created_at::date) as first_day
  from public.plays group by visitor
),
returns as (
  select f.visitor
  from firsts f
  join public.plays p
    on p.visitor = f.visitor and p.created_at::date > f.first_day
  group by f.visitor
)
select
  (select count(*) from firsts)   as players,
  (select count(*) from returns)  as returned_another_day,
  round(100.0 * (select count(*) from returns)
        / nullif((select count(*) from firsts), 0), 1) as pct_returning
from firsts
limit 1;

-- Engagement: distribution of runs-per-session (the max run_index a visitor
-- reached on each day). If most sessions are a single run, the game is not
-- pulling people into "one more try".
with sessions as (
  select visitor, created_at::date as day, max(run_index) as runs_in_session
  from public.plays group by visitor, created_at::date
)
select runs_in_session, count(*) as sessions
from sessions group by runs_in_session order by runs_in_session;

-- Where runs die, in 500-metre bands — are people bouncing in the first
-- seconds, or getting deep enough to be hooked?
select
  (score / 500) * 500 as band_start,
  count(*)            as runs
from public.plays
group by band_start order by band_start;
