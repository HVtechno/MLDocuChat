-- ============================================================
--  DocuChat — Row-Level Security (run once, after schema.sql)
--
--  This is the structural fix for the v1 ownership hole. Even if
--  backend code forgets a filter, Postgres refuses to return or
--  modify rows that don't belong to the authenticated user.
--
--  auth.uid() is the id of the currently authenticated user,
--  provided automatically by Supabase when the request carries
--  the user's JWT.
-- ============================================================

-- Turn RLS on for every table
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;
alter table public.chunks    enable row level security;
alter table public.chats     enable row level security;
alter table public.messages  enable row level security;

-- ---------- profiles ----------
create policy "own profile - select"
    on public.profiles for select
    using (auth.uid() = id);

create policy "own profile - update"
    on public.profiles for update
    using (auth.uid() = id);

-- ---------- documents ----------
create policy "own documents - all"
    on public.documents for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------- chunks ----------
create policy "own chunks - all"
    on public.chunks for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------- chats ----------
create policy "own chats - all"
    on public.chats for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------- messages ----------
create policy "own messages - all"
    on public.messages for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ============================================================
--  NOTE ON THE BACKEND SERVICE KEY
--  The FastAPI backend uses the service_role key, which BYPASSES
--  RLS by design (it's trusted server code). RLS is the safety net
--  for the anon/authenticated path and for any direct client access.
--  The backend must STILL scope every query by user_id explicitly —
--  RLS is defense-in-depth, not a substitute for correct code.
-- ============================================================

-- ---------- auto-create a profile row on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email);
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
