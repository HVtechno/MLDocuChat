-- ============================================================
--  Migration: billing (Polar) + feedback
--  Run once in the Supabase SQL editor.
-- ============================================================

-- Subscription state on the profile. The Polar webhook keeps these current.
--   plan is already present ('free' default). We add the rest.
alter table public.profiles
    add column if not exists subscription_status text default 'none',   -- none|active|canceled
    add column if not exists current_period_end  timestamptz,
    add column if not exists polar_customer_id    text;

-- Track document size (bytes) so the admin panel can report total storage.
alter table public.documents
    add column if not exists file_size bigint;

-- Feedback: a star rating + optional comment. user_id may be null if we ever
-- collect anonymous feedback, but normally it's the logged-in user.
create table if not exists public.feedback (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid references auth.users (id) on delete set null,
    email      text,
    rating     int not null check (rating between 1 and 5),
    comment    text,
    created_at timestamptz not null default now()
);

-- RLS: users can insert their own feedback; only the service role reads it
-- (the admin endpoint uses the service key, so no read policy is needed here).
alter table public.feedback enable row level security;

drop policy if exists "insert own feedback" on public.feedback;
create policy "insert own feedback" on public.feedback
    for insert with check (auth.uid() = user_id);
