-- Profile locale: currency display + timezone for daily boundaries

alter table users_profile
  add column if not exists currency text not null default 'INR',
  add column if not exists timezone text not null default 'UTC';
