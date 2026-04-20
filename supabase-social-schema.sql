-- =============================================================
-- Ilmify — Social Posts Schema
-- =============================================================
-- Exécute ce script dans Supabase Dashboard > SQL Editor
-- après avoir déjà exécuté supabase-schema.sql
-- =============================================================

-- 1. SOCIAL_POSTS — posts importés depuis TikTok / Reels / Twitter / YouTube
create table if not exists public.social_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,

  -- Source
  url text not null,                                -- URL d'origine
  platform text not null check (platform in ('tiktok', 'instagram', 'twitter', 'youtube', 'other')),
  external_id text,                                 -- ID chez la plateforme (video id)

  -- Métadonnées
  title text,
  author text,                                      -- @username / channel
  author_avatar_url text,
  caption text,
  thumbnail_url text,
  media_url text,                                   -- URL directe (CDN) vers la vidéo — peut expirer
  media_type text not null default 'video' check (media_type in ('video', 'image', 'audio')),
  duration_sec int,

  -- Statistiques scrappées (optionnel)
  stats jsonb not null default '{}',                -- { likes, views, comments, shares }

  -- Organisation
  theme_tag text,                                   -- ex: 'tazkiya', 'fiqh', 'aqida'
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  is_archived boolean not null default false,

  -- Cache / timestamps
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Contrainte d'unicité : un user ne peut importer 2x la même URL
  unique (user_id, url)
);

create index if not exists social_posts_user_idx on public.social_posts(user_id, imported_at desc);
create index if not exists social_posts_platform_idx on public.social_posts(user_id, platform);
create index if not exists social_posts_theme_idx on public.social_posts(user_id, theme_tag);

alter table public.social_posts enable row level security;

create policy "Users see own social posts"
  on public.social_posts for select using (auth.uid() = user_id);
create policy "Users insert own social posts"
  on public.social_posts for insert with check (auth.uid() = user_id);
create policy "Users update own social posts"
  on public.social_posts for update using (auth.uid() = user_id);
create policy "Users delete own social posts"
  on public.social_posts for delete using (auth.uid() = user_id);

-- 2. SOCIAL_POST_TRANSCRIPTS — transcription brute avec timestamps
create table if not exists public.social_post_transcripts (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.social_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  source_language text,                             -- 'ar', 'fr', 'en', 'auto'
  text text not null default '',                    -- transcription plate
  segments jsonb not null default '[]',             -- [{ start, end, text }, ...]

  created_at timestamptz not null default now(),
  unique (post_id)
);

alter table public.social_post_transcripts enable row level security;

create policy "Users see own transcripts"
  on public.social_post_transcripts for select using (auth.uid() = user_id);
create policy "Users insert own transcripts"
  on public.social_post_transcripts for insert with check (auth.uid() = user_id);
create policy "Users update own transcripts"
  on public.social_post_transcripts for update using (auth.uid() = user_id);
create policy "Users delete own transcripts"
  on public.social_post_transcripts for delete using (auth.uid() = user_id);

-- 3. SOCIAL_POST_SUBTITLES — pistes WebVTT (1 par langue cible)
create table if not exists public.social_post_subtitles (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.social_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  language text not null,                           -- 'fr', 'ar', 'en'
  label text,                                       -- 'Français', 'العربية'
  vtt_content text not null,                        -- contenu WebVTT complet
  is_original boolean not null default false,      -- true = piste dans la langue originale

  created_at timestamptz not null default now(),
  unique (post_id, language)
);

create index if not exists social_subtitles_post_idx on public.social_post_subtitles(post_id);

alter table public.social_post_subtitles enable row level security;

create policy "Users see own subtitles"
  on public.social_post_subtitles for select using (auth.uid() = user_id);
create policy "Users insert own subtitles"
  on public.social_post_subtitles for insert with check (auth.uid() = user_id);
create policy "Users update own subtitles"
  on public.social_post_subtitles for update using (auth.uid() = user_id);
create policy "Users delete own subtitles"
  on public.social_post_subtitles for delete using (auth.uid() = user_id);

-- 4. SOCIAL_POST_ANNOTATIONS — notes personnelles attachées à un timestamp
create table if not exists public.social_post_annotations (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.social_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  time_sec real not null default 0,                 -- moment dans la vidéo
  text text not null,
  color text,                                       -- ex: '#c49a3d'

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_annotations_post_idx on public.social_post_annotations(post_id, time_sec);

alter table public.social_post_annotations enable row level security;

create policy "Users see own annotations"
  on public.social_post_annotations for select using (auth.uid() = user_id);
create policy "Users insert own annotations"
  on public.social_post_annotations for insert with check (auth.uid() = user_id);
create policy "Users update own annotations"
  on public.social_post_annotations for update using (auth.uid() = user_id);
create policy "Users delete own annotations"
  on public.social_post_annotations for delete using (auth.uid() = user_id);

-- 5. SOCIAL_POST_ANALYSES — résumé, citations islamiques, flags IA
create table if not exists public.social_post_analyses (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.social_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,

  summary text,                                     -- résumé en bullet points
  key_points jsonb not null default '[]',           -- [{ title, detail }]
  citations jsonb not null default '[]',            -- [{ type: 'verse'|'hadith', reference, text, arabic }]
  topics jsonb not null default '[]',               -- [{ tag, description }]
  dubious_flags jsonb not null default '[]',        -- [{ reason, severity, quote }]
  language_detected text,

  created_at timestamptz not null default now(),
  unique (post_id)
);

alter table public.social_post_analyses enable row level security;

create policy "Users see own analyses"
  on public.social_post_analyses for select using (auth.uid() = user_id);
create policy "Users insert own analyses"
  on public.social_post_analyses for insert with check (auth.uid() = user_id);
create policy "Users update own analyses"
  on public.social_post_analyses for update using (auth.uid() = user_id);
create policy "Users delete own analyses"
  on public.social_post_analyses for delete using (auth.uid() = user_id);

-- =============================================================
-- DONE! Social schema ready.
-- =============================================================
