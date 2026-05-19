-- Journal letters: multiple dated entries per user (Memory Shelf)

create table if not exists journal_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  body text not null,
  mood_snapshot text check (
    mood_snapshot is null
    or mood_snapshot in (
      'sunny', 'cozy', 'dreamy', 'rainy', 'sleepy', 'golden_hour', 'stormy'
    )
  ),
  created_at timestamptz default now()
);

create index if not exists idx_journal_user_created
  on journal_letters (user_id, created_at desc);

alter table journal_letters enable row level security;

drop policy if exists "journal_own" on journal_letters;
create policy "journal_own" on journal_letters
  for all using (auth.uid() = user_id);
