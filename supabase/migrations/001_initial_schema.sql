-- Bloomlog initial schema

create table if not exists users_profile (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  cozy_hour time default '21:00',
  room_theme text default 'windowsill' check (room_theme in ('windowsill', 'balcony', 'nook')),
  onboarding_complete boolean default false,
  notifications_enabled boolean default false,
  finance_enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  mood text check (mood in ('sunny','cozy','dreamy','rainy','sleepy','golden_hour','stormy')),
  note text,
  sleep_start timestamptz,
  sleep_end timestamptz,
  sleep_quality text check (sleep_quality in ('deep','okay','restless','stormy')),
  water_ml int default 0,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  category text not null check (category in ('food','cafe','treats','travel','gifts','shopping')),
  amount numeric(10,2) not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  meal_time timestamptz default now(),
  photo_url text,
  tags text[] default '{}'
);

create table if not exists quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  quest_key text not null,
  unique (user_id, date, quest_key)
);

create table if not exists garden_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  item_key text not null,
  acquired_at timestamptz default now(),
  position jsonb default '{"x":50,"y":50,"layer":1}',
  bloom_stage int default 0 check (bloom_stage >= 0 and bloom_stage <= 3)
);

create table if not exists memory_polaroids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null,
  period_start date not null,
  period_end date not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists whispers_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  whisper_key text not null,
  shown_at timestamptz default now()
);

create index if not exists idx_daily_user_date on daily_entries (user_id, date desc);
create index if not exists idx_expenses_user_date on expenses (user_id, date desc);
create index if not exists idx_meals_user_date on meals (user_id, date desc);
create index if not exists idx_quests_user_date on quest_completions (user_id, date desc);

alter table users_profile enable row level security;
alter table daily_entries enable row level security;
alter table expenses enable row level security;
alter table meals enable row level security;
alter table quest_completions enable row level security;
alter table garden_items enable row level security;
alter table memory_polaroids enable row level security;
alter table whispers_log enable row level security;

create policy "profile_own" on users_profile for all using (auth.uid() = id);
create policy "daily_own" on daily_entries for all using (auth.uid() = user_id);
create policy "expenses_own" on expenses for all using (auth.uid() = user_id);
create policy "meals_own" on meals for all using (auth.uid() = user_id);
create policy "quests_own" on quest_completions for all using (auth.uid() = user_id);
create policy "garden_own" on garden_items for all using (auth.uid() = user_id);
create policy "polaroids_own" on memory_polaroids for all using (auth.uid() = user_id);
create policy "whispers_own" on whispers_log for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users_profile (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
