-- ============================================================
--  Migration: nickname + profession on profiles
--  Run once in the Supabase SQL editor.
--
--  nickname   — shown in the UI instead of the email.
--  profession — 'researcher' | 'student' | 'professional' | 'other'
--               drives whether Foliq shows research mode (synthesis
--               action buttons, project vocabulary tuned for research).
--               null = not yet chosen (prompt the user once).
-- ============================================================

alter table public.profiles
    add column if not exists nickname   text,
    add column if not exists profession text;
