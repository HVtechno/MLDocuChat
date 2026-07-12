-- ============================================================
--  Migration: scope documents to chats
--  Run once in the SQL editor (after the original schema.sql).
--
--  Each document now optionally belongs to a chat. A document with
--  chat_id = null is "unattached" (uploaded but not tied to a chat yet,
--  or kept for reuse). Retrieval filters by chat_id so a chat only
--  searches its own documents.
-- ============================================================

alter table public.documents
    add column if not exists chat_id uuid references public.chats (id) on delete set null;

create index if not exists idx_documents_chat on public.documents (chat_id);

-- match_chunks needs to filter by chat as well. Replace the function so
-- it accepts an optional chat filter. Passing match_chat_id restricts
-- retrieval to chunks whose document belongs to that chat.
create or replace function public.match_chunks (
    query_embedding vector(1536),
    match_user_id   uuid,
    match_count     int default 8,
    filter_document_ids uuid[] default null,
    match_chat_id   uuid default null
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
      and (match_chat_id is null or d.chat_id = match_chat_id)
    order by c.embedding <=> query_embedding
    limit match_count;
$$;
