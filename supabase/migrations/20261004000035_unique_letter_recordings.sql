create table public.hebrew_recorders (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.hebrew_recorders enable row level security;
grant select on public.hebrew_recorders to authenticated;
create policy "Recorder can see own permission" on public.hebrew_recorders for select to authenticated using (user_id = (select auth.uid()));
create table public.hebrew_recordings (
  sound_id text primary key check (sound_id ~ '^(vowel|b|v|g|d|h|z|kh|t|y|k|l|m|n|s|p|f|ts|r|sh)-(ah|ee|eh|oo|oh|uh)$'),
  storage_path text not null check (storage_path ~ '^[a-z-]+/[0-9a-f-]+\.(webm|ogg|mp4|wav|mp3)$'),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  check (split_part(storage_path, '/', 1) = sound_id)
);
alter table public.hebrew_recordings enable row level security;
grant select on public.hebrew_recordings to anon, authenticated;
grant insert, update on public.hebrew_recordings to authenticated;
create policy "Anyone can hear Hebrew recordings" on public.hebrew_recordings for select to anon, authenticated using (true);
create policy "Approved recorders insert sounds" on public.hebrew_recordings for insert to authenticated with check (updated_by = (select auth.uid()) and exists (select 1 from public.hebrew_recorders where user_id = (select auth.uid())));
create policy "Approved recorders replace sounds" on public.hebrew_recordings for update to authenticated using (exists (select 1 from public.hebrew_recorders where user_id = (select auth.uid()))) with check (updated_by = (select auth.uid()) and exists (select 1 from public.hebrew_recorders where user_id = (select auth.uid())));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('hebrew-sounds','hebrew-sounds',true, 6291456, array['audio/webm','audio/ogg','audio/mp4','audio/wav','audio/mpeg']);
create policy "Approved Hebrew audio uploads" on storage.objects for insert to authenticated with check (bucket_id = 'hebrew-sounds' and name ~ '^[a-z-]+/[0-9a-f-]+\.(webm|ogg|mp4|wav|mp3)$' and exists (select 1 from public.hebrew_recorders where user_id = (select auth.uid())));
create policy "Approved Hebrew audio cleanup" on storage.objects for select to authenticated using (bucket_id = 'hebrew-sounds' and exists (select 1 from public.hebrew_recorders where user_id = (select auth.uid())));
create policy "Approved Hebrew audio deletion" on storage.objects for delete to authenticated using (bucket_id = 'hebrew-sounds' and exists (select 1 from public.hebrew_recorders where user_id = (select auth.uid())));
