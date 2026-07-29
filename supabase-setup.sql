-- Sinegugu Security website database setup
-- Run this entire file once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.website_slides (
  id uuid primary key default gen_random_uuid(),
  position integer not null default 0,
  title text not null default 'Protecting people. Securing operations.',
  description text not null default '',
  image_url text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_news (
  id uuid primary key default gen_random_uuid(),
  published_date date not null default current_date,
  title text not null,
  summary text not null default '',
  body text not null default '',
  image_url text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_website_slides_updated_at on public.website_slides;
create trigger set_website_slides_updated_at
before update on public.website_slides
for each row execute function public.set_updated_at();

drop trigger if exists set_website_news_updated_at on public.website_news;
create trigger set_website_news_updated_at
before update on public.website_news
for each row execute function public.set_updated_at();

drop trigger if exists set_website_settings_updated_at on public.website_settings;
create trigger set_website_settings_updated_at
before update on public.website_settings
for each row execute function public.set_updated_at();

alter table public.website_slides enable row level security;
alter table public.website_news enable row level security;
alter table public.website_settings enable row level security;

-- Public visitors may read published website content.
drop policy if exists "Public reads published slides" on public.website_slides;
create policy "Public reads published slides"
on public.website_slides for select
to anon, authenticated
using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "Public reads published news" on public.website_news;
create policy "Public reads published news"
on public.website_news for select
to anon, authenticated
using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "Public reads website settings" on public.website_settings;
create policy "Public reads website settings"
on public.website_settings for select
to anon, authenticated
using (true);

-- Any signed-in Supabase user may administer this small private dashboard.
drop policy if exists "Authenticated manages slides" on public.website_slides;
create policy "Authenticated manages slides"
on public.website_slides for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated manages news" on public.website_news;
create policy "Authenticated manages news"
on public.website_news for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated manages settings" on public.website_settings;
create policy "Authenticated manages settings"
on public.website_settings for all
to authenticated
using (true)
with check (true);

insert into public.website_settings (key, value)
values ('quote_email', '"info@sinegugusecurity.co.za"'::jsonb)
on conflict (key) do nothing;

-- Public media bucket used for slideshow and news images.
insert into storage.buckets (id, name, public)
values ('website-media', 'website-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public reads website media" on storage.objects;
create policy "Public reads website media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'website-media');

drop policy if exists "Authenticated uploads website media" on storage.objects;
create policy "Authenticated uploads website media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'website-media');

drop policy if exists "Authenticated updates website media" on storage.objects;
create policy "Authenticated updates website media"
on storage.objects for update
to authenticated
using (bucket_id = 'website-media')
with check (bucket_id = 'website-media');

drop policy if exists "Authenticated deletes website media" on storage.objects;
create policy "Authenticated deletes website media"
on storage.objects for delete
to authenticated
using (bucket_id = 'website-media');
