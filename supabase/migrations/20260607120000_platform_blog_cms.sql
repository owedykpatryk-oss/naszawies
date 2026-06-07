-- Blog platformowy (redakcja naszawies.pl) — przygotowanie pod Payload CMS / panel admina.
-- Frontend czyta obecnie pliki content/blog/*.json; po migracji można przełączyć źródło na DB.

create table if not exists public.platform_blog_authors (
  id text primary key,
  name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_blog_categories (
  slug text primary key,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.platform_blog_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content_html text not null default '',
  cover_image_url text,
  gallery_urls jsonb not null default '[]'::jsonb,
  author_id text not null references public.platform_blog_authors(id),
  category_slug text not null references public.platform_blog_categories(slug),
  tags text[] not null default '{}',
  faq jsonb not null default '[]'::jsonb,
  related_slugs text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  og_image_url text,
  reading_time_min int,
  internal_links jsonb not null default '[]'::jsonb,
  generated_images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_blog_articles_status_published_idx
  on public.platform_blog_articles (status, published_at desc nulls last);

create index if not exists platform_blog_articles_category_idx
  on public.platform_blog_articles (category_slug);

alter table public.platform_blog_articles enable row level security;
alter table public.platform_blog_authors enable row level security;
alter table public.platform_blog_categories enable row level security;

-- Publiczny odczyt opublikowanych artykułów (anon + authenticated).
create policy platform_blog_articles_public_read on public.platform_blog_articles
  for select using (status = 'published');

create policy platform_blog_authors_public_read on public.platform_blog_authors
  for select using (true);

create policy platform_blog_categories_public_read on public.platform_blog_categories
  for select using (true);

-- Zapis tylko dla administratora platformy.
create policy platform_blog_articles_admin_all on public.platform_blog_articles
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy platform_blog_authors_admin_all on public.platform_blog_authors
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy platform_blog_categories_admin_all on public.platform_blog_categories
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
