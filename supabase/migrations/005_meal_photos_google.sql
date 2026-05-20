-- Meal photo storage metadata + Google Calendar connections

alter table food_log_entries
  add column if not exists photo_thumb_path text,
  add column if not exists photo_full_path text,
  add column if not exists photo_bytes int;

create table if not exists google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_sub text not null default '',
  email text not null default '',
  scopes text[] not null default '{}',
  refresh_token_ciphertext text not null,
  access_token_ciphertext text,
  token_expires_at timestamptz,
  calendar_verified_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table google_connections enable row level security;

create policy "users_read_own_google_connection"
  on google_connections for select
  using (auth.uid() = user_id);

-- Private meal photo bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  2097152,
  array['image/webp', 'image/jpeg']
)
on conflict (id) do nothing;

create policy "meal_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "meal_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "meal_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
