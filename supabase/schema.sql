-- ============================================================
--  DocuChat — Supabase schema (run once in the SQL editor)
--  Order matters: extension -> tables -> indexes -> function -> RLS
-- ============================================================

-- 1. Enable pgvector (vectors live in the same DB as everything else)
create extension if not exists vector;

-- ============================================================
--  TABLES
--  Note: auth.users is managed by Supabase Auth. We reference it
--  by id (uuid) and never store passwords ourselves.
-- ============================================================

-- Profiles: extends auth.users with app-specific fields (plan, etc.)
create table if not exists public.profiles (
    id           uuid primary key references auth.users (id) on delete cascade,
    email        text,
    plan         text not null default 'free',
    plan_expires timestamptz,
    created_at   timestamptz not null default now()
);

-- Documents: one row per uploaded PDF
create table if not exists public.documents (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users (id) on delete cascade,
    filename     text not null,
    storage_path text not null,           -- path in Supabase Storage bucket
    page_count   int,
    status       text not null default 'processing',  -- processing | ready | failed
    created_at   timestamptz not null default now()
);

-- Chunks: text pieces + their embeddings. This is the vector store.
-- 1536 dims = OpenAI text-embedding-3-small
create table if not exists public.chunks (
    id          uuid primary key default gen_random_uuid(),
    document_id uuid not null references public.documents (id) on delete cascade,
    user_id     uuid not null references auth.users (id) on delete cascade,
    content     text not null,
    page        int,                      -- source page, for citations
    chunk_index int,                      -- order within the document
    embedding   vector(1536),
    created_at  timestamptz not null default now()
);

-- Chats: a conversation thread (grouped Q&A over documents)
create table if not exists public.chats (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users (id) on delete cascade,
    title      text not null default 'New chat',
    created_at timestamptz not null default now()
);

-- Messages: individual turns within a chat
create table if not exists public.messages (
    id         uuid primary key default gen_random_uuid(),
    chat_id    uuid not null references public.chats (id) on delete cascade,
    user_id    uuid not null references auth.users (id) on delete cascade,
    role       text not null,             -- user | assistant
    content    text not null,
    citations  jsonb,                     -- [{document_id, filename, page, snippet}]
    created_at timestamptz not null default now()
);

-- ============================================================
--  INDEXES
-- ============================================================

-- Foreign-key lookups (fast filtering by owner / parent)
create index if not exists idx_documents_user   on public.documents (user_id);
create index if not exists idx_chunks_user       on public.chunks (user_id);
create index if not exists idx_chunks_document   on public.chunks (document_id);
create index if not exists idx_chats_user        on public.chats (user_id);
create index if not exists idx_messages_chat     on public.messages (chat_id);

-- Vector similarity index (HNSW = fast approximate nearest-neighbour).
-- cosine distance pairs with normalized OpenAI embeddings.
create index if not exists idx_chunks_embedding
    on public.chunks
    using hnsw (embedding vector_cosine_ops);

-- ============================================================
--  SIMILARITY SEARCH FUNCTION
--  Called by the backend. Runs the vector search *inside* Postgres
--  and enforces the owner filter, so retrieval can never leak
--  another user's chunks even if backend code has a bug.
-- ============================================================

create or replace function public.match_chunks (
    query_embedding vector(1536),
    match_user_id   uuid,
    match_count     int default 8,
    filter_document_ids uuid[] default null
)
returns table (
    id          uuid,
    document_id uuid,
    content     text,
    page        int,
    filename    text,
    similarity  float
)
language sql stable
as $$
    select
        c.id,
        c.document_id,
        c.content,
        c.page,
        d.filename,
        1 - (c.embedding <=> query_embedding) as similarity
    from public.chunks c
    join public.documents d on d.id = c.document_id
    where c.user_id = match_user_id
      and (filter_document_ids is null
           or c.document_id = any (filter_document_ids))
    order by c.embedding <=> query_embedding
    limit match_count;
$$;
