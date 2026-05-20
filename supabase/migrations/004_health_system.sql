-- Bloomlog health / nourish system

alter table users_profile add column if not exists health_enabled boolean default true;
alter table users_profile add column if not exists soft_calorie_target int;
alter table users_profile add column if not exists water_goal_ml int default 2000;
alter table users_profile add column if not exists macro_style text default 'balanced'
  check (macro_style in ('balanced', 'protein_forward', 'gentle'));
alter table users_profile add column if not exists calorie_display text default 'soft'
  check (calorie_display in ('hidden', 'soft', 'open'));
alter table users_profile add column if not exists health_onboarding_done boolean default false;

create table if not exists food_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  logged_at timestamptz default now(),
  meal_slot text not null check (meal_slot in (
    'breakfast', 'lunch', 'dinner', 'snack', 'treat', 'cafe_drink'
  )),
  name text not null default 'meal',
  photo_url text,
  emotional_tags text[] default '{}',
  calories int,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  fiber_g numeric(6,1),
  journal_note text,
  source text not null default 'quick' check (source in (
    'quick', 'favorite', 'ai_estimate', 'recipe', 'polaroid'
  )),
  source_meta jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists food_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  emoji text default '🍽️',
  meal_slot text default 'snack',
  calories int,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  created_at timestamptz default now(),
  unique (user_id, name)
);

create table if not exists ai_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ingredients_hash text not null,
  ingredients_raw text not null,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists ai_recipes_cache (
  ingredients_hash text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null,
  tokens_in int default 0,
  tokens_out int default 0,
  created_at timestamptz default now()
);

create table if not exists health_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  period_start date not null,
  period_end date not null,
  kind text not null,
  payload jsonb default '{}',
  source text default 'rule' check (source in ('rule', 'ai')),
  created_at timestamptz default now()
);

create index if not exists idx_food_log_user_date on food_log_entries (user_id, date desc);
create index if not exists idx_food_log_user_logged on food_log_entries (user_id, logged_at desc);
create index if not exists idx_food_favorites_user on food_favorites (user_id);
create index if not exists idx_ai_recipes_user on ai_recipes (user_id, created_at desc);
create index if not exists idx_ai_usage_user_day on ai_usage_log (user_id, created_at desc);
create index if not exists idx_health_insights_user on health_insights (user_id, period_end desc);

alter table food_log_entries enable row level security;
alter table food_favorites enable row level security;
alter table ai_recipes enable row level security;
alter table ai_recipes_cache enable row level security;
alter table ai_usage_log enable row level security;
alter table health_insights enable row level security;

create policy "food_log_own" on food_log_entries for all using (auth.uid() = user_id);
create policy "food_favorites_own" on food_favorites for all using (auth.uid() = user_id);
create policy "ai_recipes_own" on ai_recipes for all using (auth.uid() = user_id);
create policy "ai_recipes_cache_read" on ai_recipes_cache for select using (true);
create policy "ai_recipes_cache_write" on ai_recipes_cache for insert with check (true);
create policy "ai_usage_own" on ai_usage_log for all using (auth.uid() = user_id);
create policy "health_insights_own" on health_insights for all using (auth.uid() = user_id);

-- Migrate legacy meals into food_log_entries (idempotent)
insert into food_log_entries (
  id, user_id, date, logged_at, meal_slot, name, photo_url, emotional_tags, source
)
select
  m.id,
  m.user_id,
  m.date,
  coalesce(m.meal_time, now()),
  'snack',
  'polaroid meal',
  m.photo_url,
  coalesce(m.tags, '{}'),
  'polaroid'
from meals m
where not exists (
  select 1 from food_log_entries f where f.id = m.id
);
