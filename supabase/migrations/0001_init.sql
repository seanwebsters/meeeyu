-- Meeeyu core schema
-- Run against a Supabase project (SQL editor or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name text,
  avatar_url text,
  bio text,
  vibe text not null default 'soft' check (
    vibe in ('soft','bold','dreamy','retro','minimal','playful','indie','y2k','cute')
  ),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on profiles (lower(username));

-- ---------------------------------------------------------------------------
-- profile_cards — the scrapbook content blocks
-- ---------------------------------------------------------------------------
create table if not exists profile_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (
    type in ('photo','music','film','place','book','food','quote','fact','mood',
              'obsession','person','thing','outfit','memory','custom')
  ),
  title text,
  content jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  rotation real not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_cards_profile_idx on profile_cards (profile_id, position);

-- ---------------------------------------------------------------------------
-- prompts — global catalog ("what animal would I be?", etc.)
-- ---------------------------------------------------------------------------
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- prompt_self_answers — how the profile owner answers about themself
-- ---------------------------------------------------------------------------
create table if not exists prompt_self_answers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 280),
  created_at timestamptz not null default now(),
  unique (profile_id, prompt_id)
);

-- ---------------------------------------------------------------------------
-- share_links — tokenised links that power the viral loop
-- ---------------------------------------------------------------------------
create table if not exists share_links (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(6), 'hex'),
  profile_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists share_links_profile_idx on share_links (profile_id);

-- ---------------------------------------------------------------------------
-- prompt_friend_answers — how friends see the profile owner ("YOU" side)
-- ---------------------------------------------------------------------------
create table if not exists prompt_friend_answers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  prompt_id uuid not null references prompts(id) on delete cascade,
  responder_id uuid references profiles(id) on delete set null,
  responder_name text,
  answer text not null check (char_length(answer) between 1 and 280),
  is_anonymous boolean not null default true,
  share_token text references share_links(token) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists prompt_friend_answers_profile_prompt_idx
  on prompt_friend_answers (profile_id, prompt_id);

-- ---------------------------------------------------------------------------
-- reactions — lightweight taps on a profile or a specific card
-- ---------------------------------------------------------------------------
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  card_id uuid references profile_cards(id) on delete cascade,
  reactor_id uuid references profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now()
);

create index if not exists reactions_profile_idx on reactions (profile_id);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists profile_cards_set_updated_at on profile_cards;
create trigger profile_cards_set_updated_at
  before update on profile_cards
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table profile_cards enable row level security;
alter table prompts enable row level security;
alter table prompt_self_answers enable row level security;
alter table prompt_friend_answers enable row level security;
alter table share_links enable row level security;
alter table reactions enable row level security;
alter table follows enable row level security;

-- profiles: public read, owner write
create policy "profiles are publicly readable" on profiles
  for select using (true);

create policy "users can insert their own profile" on profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "users can update their own profile" on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- profile_cards: public read, owner write
create policy "cards are publicly readable" on profile_cards
  for select using (true);

create policy "owners can insert their own cards" on profile_cards
  for insert to authenticated
  with check (profile_id = auth.uid());

create policy "owners can update their own cards" on profile_cards
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "owners can delete their own cards" on profile_cards
  for delete to authenticated
  using (profile_id = auth.uid());

-- prompts: public read only (catalog is curated server-side / via SQL)
create policy "prompts are publicly readable" on prompts
  for select using (is_active);

-- prompt_self_answers: public read, owner write
create policy "self answers are publicly readable" on prompt_self_answers
  for select using (true);

create policy "owners can upsert their own self answers" on prompt_self_answers
  for insert to authenticated
  with check (profile_id = auth.uid());

create policy "owners can update their own self answers" on prompt_self_answers
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "owners can delete their own self answers" on prompt_self_answers
  for delete to authenticated
  using (profile_id = auth.uid());

-- share_links: public read (needed to resolve a token with no session),
-- owner-only create
create policy "share links are publicly readable" on share_links
  for select using (true);

create policy "owners can create share links for their profile" on share_links
  for insert to authenticated
  with check (profile_id = auth.uid());

-- prompt_friend_answers: public read (aggregated "YOU" side), anyone holding
-- a valid share link can answer — this is what powers the viral loop
create policy "friend answers are publicly readable" on prompt_friend_answers
  for select using (true);

create policy "anyone with a valid share link can answer" on prompt_friend_answers
  for insert to anon, authenticated
  with check (
    -- a signed-in user answering directly on someone's public profile
    (responder_id is not null and responder_id = auth.uid())
    or
    -- an anonymous visitor who arrived through a valid /ask/[token] link
    (
      (responder_id is null or responder_id = auth.uid())
      and exists (
        select 1 from share_links sl
        where sl.token = prompt_friend_answers.share_token
          and sl.profile_id = prompt_friend_answers.profile_id
          and (sl.prompt_id is null or sl.prompt_id = prompt_friend_answers.prompt_id)
      )
    )
  );

create policy "responders can delete their own friend answers" on prompt_friend_answers
  for delete to authenticated
  using (responder_id = auth.uid());

-- reactions: public read, anon/authenticated insert, owner delete
create policy "reactions are publicly readable" on reactions
  for select using (true);

create policy "anyone can react" on reactions
  for insert to anon, authenticated
  with check (reactor_id is null or reactor_id = auth.uid());

create policy "reactors can remove their own reaction" on reactions
  for delete to authenticated
  using (reactor_id = auth.uid());

-- follows: public read, authenticated manage own edges
create policy "follows are publicly readable" on follows
  for select using (true);

create policy "users can follow as themselves" on follows
  for insert to authenticated
  with check (follower_id = auth.uid());

create policy "users can unfollow as themselves" on follows
  for delete to authenticated
  using (follower_id = auth.uid());

-- ---------------------------------------------------------------------------
-- storage: public avatar bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
