-- =====================================================================
-- Life in One — initial schema
-- All tables live in `public`. Every table has RLS enabled with a policy
-- restricting rows to the owning auth.uid(). Types and constraints are
-- intentionally conservative — richer domain logic lives in packages/core.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles & theming
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  avatar_url    text,
  theme_mode    text check (theme_mode in ('light','dark','system')) default 'system',
  accent_color  text default '#6366f1',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------
create table public.task_categories (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  name     text not null,
  color    text,
  created_at timestamptz not null default now()
);
create index task_categories_user_idx on public.task_categories (user_id);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  title        text not null,
  description  text,
  priority     smallint check (priority between 1 and 4) default 2,
  due_at       timestamptz,
  category_id  uuid references public.task_categories on delete set null,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tasks_user_due_idx on public.tasks (user_id, completed_at, due_at);

-- ---------------------------------------------------------------------
-- calendar
-- ---------------------------------------------------------------------
create table public.calendar_accounts (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users on delete cascade,
  provider                 text not null default 'google',
  google_calendar_id       text,
  sync_token               text,
  access_token_encrypted   text,
  refresh_token_encrypted  text,
  expires_at               timestamptz,
  created_at               timestamptz not null default now()
);

create table public.calendar_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  account_id   uuid references public.calendar_accounts on delete cascade,
  external_id  text,
  title        text not null,
  description  text,
  location     text,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  all_day      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (account_id, external_id)
);
create index calendar_events_user_range_idx on public.calendar_events (user_id, starts_at, ends_at);

-- ---------------------------------------------------------------------
-- journal
-- ---------------------------------------------------------------------
create table public.journal_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  entry_date   date not null,
  title        text,
  content_json jsonb,
  content_text text,
  mood         smallint check (mood between 1 and 5),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index journal_entries_user_date_idx on public.journal_entries (user_id, entry_date desc);
create index journal_entries_search_idx
  on public.journal_entries
  using gin (to_tsvector('english', coalesce(content_text, '')));

create table public.journal_tags (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  name     text not null,
  unique (user_id, name)
);

create table public.journal_entry_tags (
  entry_id uuid not null references public.journal_entries on delete cascade,
  tag_id   uuid not null references public.journal_tags on delete cascade,
  primary key (entry_id, tag_id)
);

-- ---------------------------------------------------------------------
-- budget
-- ---------------------------------------------------------------------
create table public.budget_categories (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  name     text not null,
  kind     text not null check (kind in ('income','expense','savings')),
  color    text,
  created_at timestamptz not null default now()
);

create table public.budget_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  category_id  uuid references public.budget_categories on delete set null,
  amount_cents bigint not null,
  currency     text not null default 'KES',
  occurred_on  date not null,
  note         text,
  created_at   timestamptz not null default now()
);
create index budget_tx_user_date_idx on public.budget_transactions (user_id, occurred_on desc);

-- ---------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------
create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  title        text not null,
  description  text,
  year         smallint not null,
  status       text not null check (status in ('pending','in_progress','achieved','abandoned')) default 'pending',
  target_date  date,
  achieved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index goals_user_year_idx on public.goals (user_id, year);

-- ---------------------------------------------------------------------
-- health (provider-agnostic — v1 is manual entry)
-- ---------------------------------------------------------------------
create table public.health_metrics (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  metric_type  text not null,        -- 'steps' | 'weight_kg' | 'sleep_min' | 'heart_rate_bpm' | ...
  value        numeric not null,
  recorded_at  timestamptz not null,
  source       text not null default 'manual',
  external_id  text,
  created_at   timestamptz not null default now(),
  unique (user_id, metric_type, recorded_at, source)
);
create index health_metrics_user_type_idx on public.health_metrics (user_id, metric_type, recorded_at desc);

-- ---------------------------------------------------------------------
-- bible journal
-- ---------------------------------------------------------------------
create table public.bible_notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  service_date  date,
  service_title text,
  speaker       text,
  content_json  jsonb,
  content_text  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index bible_notes_user_date_idx on public.bible_notes (user_id, service_date desc);

create table public.bible_note_verses (
  id           uuid primary key default gen_random_uuid(),
  note_id      uuid not null references public.bible_notes on delete cascade,
  book         text not null,
  chapter      smallint not null,
  verse_start  smallint not null,
  verse_end    smallint,
  translation  text not null default 'KJV',
  text         text
);
create index bible_note_verses_note_idx on public.bible_note_verses (note_id);

-- ---------------------------------------------------------------------
-- updated_at auto-touch
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','tasks','calendar_events','journal_entries','goals','bible_notes'
  ] loop
    execute format(
      'create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Row Level Security — every table gated on user_id = auth.uid()
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.task_categories      enable row level security;
alter table public.tasks                enable row level security;
alter table public.calendar_accounts    enable row level security;
alter table public.calendar_events      enable row level security;
alter table public.journal_entries      enable row level security;
alter table public.journal_tags         enable row level security;
alter table public.journal_entry_tags   enable row level security;
alter table public.budget_categories    enable row level security;
alter table public.budget_transactions  enable row level security;
alter table public.goals                enable row level security;
alter table public.health_metrics       enable row level security;
alter table public.bible_notes          enable row level security;
alter table public.bible_note_verses    enable row level security;

-- profiles: id IS the user id (no user_id column)
create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- helper: emit the same 4-verb owner policy on every user-scoped table
do $$
declare
  t text;
begin
  foreach t in array array[
    'task_categories','tasks',
    'calendar_accounts','calendar_events',
    'journal_entries','journal_tags',
    'budget_categories','budget_transactions',
    'goals','health_metrics','bible_notes'
  ] loop
    execute format('create policy %I on public.%I for select using (auth.uid() = user_id);', t || '_owner_select', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id);', t || '_owner_insert', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t || '_owner_update', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = user_id);', t || '_owner_delete', t);
  end loop;
end $$;

-- join tables — auth via parent
create policy "journal_entry_tags_owner_all" on public.journal_entry_tags
  for all using (
    exists (select 1 from public.journal_entries e where e.id = entry_id and e.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.journal_entries e where e.id = entry_id and e.user_id = auth.uid())
  );

create policy "bible_note_verses_owner_all" on public.bible_note_verses
  for all using (
    exists (select 1 from public.bible_notes n where n.id = note_id and n.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.bible_notes n where n.id = note_id and n.user_id = auth.uid())
  );
