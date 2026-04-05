-- =============================================================
-- Ilmify - Supabase SQL Schema
-- =============================================================
-- Execute this ENTIRE script in Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. Profiles (linked to Supabase Auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Chacun peut voir les profils"
  on public.profiles for select using (true);

create policy "L'utilisateur peut modifier son profil"
  on public.profiles for update using (auth.uid() = id);

create policy "Insertion automatique à l'inscription"
  on public.profiles for insert with check (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Books
create table public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  author text not null default '',
  cover_url text,
  description text not null default '',
  category text not null default '',
  language text not null default 'fr',
  isbn text,
  status text not null default 'to-read' check (status in ('to-read', 'reading', 'read')),
  progress real,
  rating real,
  tags text[] not null default '{}',
  personal_notes text,
  passage_count int not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  added_at timestamptz not null default now()
);

alter table public.books enable row level security;

create policy "Users see own books"
  on public.books for select using (auth.uid() = user_id);
create policy "Users insert own books"
  on public.books for insert with check (auth.uid() = user_id);
create policy "Users update own books"
  on public.books for update using (auth.uid() = user_id);
create policy "Users delete own books"
  on public.books for delete using (auth.uid() = user_id);

-- 3. Book Passages
create table public.book_passages (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null default '',
  personal_reflection text,
  page_number int,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  is_important boolean not null default false,
  theme_id text,
  added_at timestamptz not null default now()
);

alter table public.book_passages enable row level security;

create policy "Users see own passages"
  on public.book_passages for select using (auth.uid() = user_id);
create policy "Users insert own passages"
  on public.book_passages for insert with check (auth.uid() = user_id);
create policy "Users update own passages"
  on public.book_passages for update using (auth.uid() = user_id);
create policy "Users delete own passages"
  on public.book_passages for delete using (auth.uid() = user_id);

-- 4. Topics
create table public.topics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  icon text,
  cover_image text,
  blocks jsonb not null default '[]',
  tags text[] not null default '{}',
  category text,
  is_pinned boolean not null default false,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "Users see own topics"
  on public.topics for select using (auth.uid() = user_id);
create policy "Users insert own topics"
  on public.topics for insert with check (auth.uid() = user_id);
create policy "Users update own topics"
  on public.topics for update using (auth.uid() = user_id);
create policy "Users delete own topics"
  on public.topics for delete using (auth.uid() = user_id);

-- 5. Course Folders
create table public.course_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  icon text,
  parent_id uuid references public.course_folders(id) on delete cascade,
  order_num int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_folders enable row level security;

create policy "Users see own folders"
  on public.course_folders for select using (auth.uid() = user_id);
create policy "Users insert own folders"
  on public.course_folders for insert with check (auth.uid() = user_id);
create policy "Users update own folders"
  on public.course_folders for update using (auth.uid() = user_id);
create policy "Users delete own folders"
  on public.course_folders for delete using (auth.uid() = user_id);

-- 6. Course Pages
create table public.course_pages (
  id uuid default gen_random_uuid() primary key,
  folder_id uuid references public.course_folders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  blocks jsonb not null default '[]',
  tags text[] not null default '{}',
  icon text,
  cover_image text,
  order_num int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_pages enable row level security;

create policy "Users see own pages"
  on public.course_pages for select using (auth.uid() = user_id);
create policy "Users insert own pages"
  on public.course_pages for insert with check (auth.uid() = user_id);
create policy "Users update own pages"
  on public.course_pages for update using (auth.uid() = user_id);
create policy "Users delete own pages"
  on public.course_pages for delete using (auth.uid() = user_id);

-- 7. Flashcard Decks
create table public.flashcard_decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  theme_id text,
  card_count int not null default 0,
  mastered_count int not null default 0,
  color text not null default '#0d9488',
  icon text,
  last_studied_at timestamptz,
  to_review_count int not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.flashcard_decks enable row level security;

create policy "Users see own decks"
  on public.flashcard_decks for select using (auth.uid() = user_id);
create policy "Users insert own decks"
  on public.flashcard_decks for insert with check (auth.uid() = user_id);
create policy "Users update own decks"
  on public.flashcard_decks for update using (auth.uid() = user_id);
create policy "Users delete own decks"
  on public.flashcard_decks for delete using (auth.uid() = user_id);

-- 8. Flashcards
create table public.flashcards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references public.flashcard_decks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  front text not null,
  back text not null,
  tags text[] not null default '{}',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  mastery_level real not null default 0,
  next_review_at timestamptz,
  review_count int not null default 0,
  theme_id text,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.flashcards enable row level security;

create policy "Users see own flashcards"
  on public.flashcards for select using (auth.uid() = user_id);
create policy "Users insert own flashcards"
  on public.flashcards for insert with check (auth.uid() = user_id);
create policy "Users update own flashcards"
  on public.flashcards for update using (auth.uid() = user_id);
create policy "Users delete own flashcards"
  on public.flashcards for delete using (auth.uid() = user_id);

-- 9. Favorites
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_type text not null,
  item_id text not null,
  title text,
  preview text,
  added_at timestamptz not null default now(),
  unique(user_id, item_type, item_id)
);

alter table public.favorites enable row level security;

create policy "Users see own favorites"
  on public.favorites for select using (auth.uid() = user_id);
create policy "Users insert own favorites"
  on public.favorites for insert with check (auth.uid() = user_id);
create policy "Users delete own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- 10. Quiz Questions (user-owned)
create table public.quiz_questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  theme_id text not null default '',
  type text not null default 'mcq' check (type in ('mcq', 'true-false', 'short-answer', 'association')),
  question text not null,
  options text[],
  correct_answer text not null,
  explanation text not null default '',
  source text,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  mastery_level real not null default 0,
  error_count int not null default 0,
  review_count int not null default 0,
  last_reviewed_at timestamptz,
  tags text[] not null default '{}',
  proof text,
  created_at timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

create policy "Users see own quiz questions"
  on public.quiz_questions for select using (auth.uid() = user_id);
create policy "Users insert own quiz questions"
  on public.quiz_questions for insert with check (auth.uid() = user_id);
create policy "Users update own quiz questions"
  on public.quiz_questions for update using (auth.uid() = user_id);
create policy "Users delete own quiz questions"
  on public.quiz_questions for delete using (auth.uid() = user_id);

-- 11. Quiz Sessions (history)
create table public.quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  theme_id text,
  questions text[] not null default '{}',
  answers jsonb not null default '{}',
  score int not null default 0,
  total int not null default 0,
  completed_at timestamptz not null default now()
);

alter table public.quiz_sessions enable row level security;

create policy "Users see own quiz sessions"
  on public.quiz_sessions for select using (auth.uid() = user_id);
create policy "Users insert own quiz sessions"
  on public.quiz_sessions for insert with check (auth.uid() = user_id);

-- 12. Activity Streak Tracking
create table public.user_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_date date not null default current_date,
  activity_type text not null default 'general',
  count int not null default 1,
  unique(user_id, activity_date, activity_type)
);

alter table public.user_activity enable row level security;

create policy "Users see own activity"
  on public.user_activity for select using (auth.uid() = user_id);
create policy "Users insert own activity"
  on public.user_activity for insert with check (auth.uid() = user_id);
create policy "Users update own activity"
  on public.user_activity for update using (auth.uid() = user_id);

-- 10. Storage bucket for images (covers, avatars, editor images)
insert into storage.buckets (id, name, public) values ('images', 'images', true);

create policy "Anyone can view images"
  on storage.objects for select using (bucket_id = 'images');

create policy "Auth users can upload images"
  on storage.objects for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Users can update own images"
  on storage.objects for update using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own images"
  on storage.objects for delete using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================
-- DONE! Your database is ready.
-- =============================================================
