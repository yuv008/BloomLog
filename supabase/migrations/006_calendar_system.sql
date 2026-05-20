-- BloomLog native calendar + remove Google Calendar storage

drop table if exists google_connections;

create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_date date not null,
  title text not null,
  notes text,
  category text not null default 'other' check (category in (
    'nourish', 'move', 'rest', 'care', 'study', 'social', 'home', 'ritual', 'other'
  )),
  kind text not null default 'task' check (kind in (
    'task', 'event', 'routine_instance', 'wellness_derived'
  )),
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean not null default false,
  ritual_end_date date,
  priority smallint not null default 1 check (priority between 1 and 3),
  status text not null default 'open' check (status in ('open', 'done', 'skipped', 'archived')),
  recurrence_rule_id uuid,
  linked_quest_key text,
  linked_food_log_id uuid,
  linked_daily_entry_date date,
  source_meta jsonb not null default '{}',
  position_order int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recurrence_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  interval_count int not null default 1,
  by_weekday int[] default '{}',
  starts_on date not null,
  ends_on date,
  template jsonb not null default '{}',
  last_generated_through date,
  created_at timestamptz not null default now()
);

alter table calendar_events
  add constraint calendar_events_recurrence_fk
  foreign key (recurrence_rule_id) references recurrence_rules(id) on delete set null;

create table if not exists routine_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'ritual',
  default_time time,
  emoji text default '🌿',
  garden_reward_key text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists calendar_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references calendar_events(id) on delete cascade,
  remind_at timestamptz not null,
  channel text not null default 'in_app' check (channel in ('in_app', 'push')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_date date not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists calendar_events_user_date_idx
  on calendar_events (user_id, ritual_date);
create index if not exists calendar_events_user_status_date_idx
  on calendar_events (user_id, status, ritual_date);
create index if not exists calendar_events_user_starts_idx
  on calendar_events (user_id, starts_at);
create index if not exists recurrence_rules_user_idx on recurrence_rules (user_id);
create index if not exists routine_templates_user_idx on routine_templates (user_id);

alter table calendar_events enable row level security;
alter table recurrence_rules enable row level security;
alter table routine_templates enable row level security;
alter table calendar_reminders enable row level security;
alter table activity_log enable row level security;

create policy calendar_events_own on calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy recurrence_rules_own on recurrence_rules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy routine_templates_own on routine_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy calendar_reminders_own on calendar_reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy activity_log_own on activity_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
