-- ============================================================
--  Storage policies for the private 'documents' bucket.
--  Run once in the SQL editor, after creating the bucket.
--
--  Storage is a separate system from the database, with its own RLS.
--  These policies scope every object to the folder named after the
--  user's id (the first path segment), so users can only touch their
--  own files. The backend service key bypasses these, but they make
--  the bucket correct and safe for any authenticated access.
-- ============================================================

-- Allow authenticated users to upload into their own {user_id}/... folder
create policy "own folder - insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Read own files
create policy "own folder - select"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete own files
create policy "own folder - delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
