-- VoysNote schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Text ids keep demo content and admin-created rows interchangeable.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Users

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  avatar_url text,
  email text,
  interests text[] not null default '{}',
  subscription_status text not null default 'free' check (subscription_status in ('free', 'plus')),
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_plus() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and subscription_status = 'plus');
$$;

-- Listeners can edit their profile, but entitlements and roles only change
-- server-side (Stripe webhook / service role).
create or replace function public.protect_profile_fields() returns trigger
language plpgsql as $$
begin
  -- Requests from the app run as anon/authenticated; the SQL editor and service role are trusted.
  if current_user in ('anon', 'authenticated')
     and (new.subscription_status is distinct from old.subscription_status or new.role is distinct from old.role) then
    raise exception 'subscription_status and role are managed by the server';
  end if;
  return new;
end $$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- New auth users get a profile row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalog

create table public.creators (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  username text not null unique,
  avatar_url text,
  portrait_url text,
  bio text not null default '',
  role_line text not null default '',
  category text not null check (category in ('Creativity','Business','Music','Sport','Life','Confidence','Culture','Wellness')),
  verified boolean not null default false,
  founding_voice boolean not null default false,
  followers_count integer not null default 0,
  joined_at timestamptz not null default now(),
  tone text,
  user_id uuid references auth.users on delete set null, -- the creator's own login, for a future creator app
  created_at timestamptz not null default now()
);

create table public.sponsors (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  tagline text not null default '',
  url text not null default '#',
  created_at timestamptz not null default now()
);

create table public.series (
  id text primary key default gen_random_uuid()::text,
  creator_id text not null references creators on delete cascade,
  title text not null,
  description text not null default '',
  price_pence integer not null default 0 check (price_pence >= 0),
  billing text not null default 'one_off' check (billing in ('one_off', 'subscription')),
  cover_image_url text,
  sponsor_id text references sponsors on delete set null,
  episode_count integer not null default 30,
  unlock_cadence text not null default 'daily' check (unlock_cadence in ('daily', 'all')),
  stripe_price_id text,
  created_at timestamptz not null default now()
);

create table public.series_episodes (
  id text primary key default gen_random_uuid()::text,
  series_id text not null references series on delete cascade,
  day integer not null,
  title text not null,
  transcript text not null default '',
  duration numeric(5,2) not null check (duration > 0 and duration <= 30.5),
  audio_url text,
  waveform jsonb not null default '[]',
  unique (series_id, day)
);

create table public.voice_notes (
  id text primary key default gen_random_uuid()::text,
  creator_id text not null references creators on delete cascade,
  audio_url text,
  -- The format: thirty seconds, max. (Longer special drops would get their own flag.)
  duration numeric(5,2) not null check (duration > 0 and duration <= 30.5),
  waveform jsonb not null default '[]',
  title text not null default '',
  transcript text not null default '',
  created_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  premium boolean not null default false,
  early_access_until timestamptz,
  sponsor_id text references sponsors on delete set null,
  series_id text references series on delete set null,
  reaction_counts jsonb not null default '{}'
);
create index voice_notes_published_idx on public.voice_notes (published_at desc);
create index voice_notes_creator_idx on public.voice_notes (creator_id, published_at desc);

-- "X joined the group" and other moments in the conversation.
create table public.feed_events (
  id text primary key default gen_random_uuid()::text,
  type text not null default 'joined' check (type in ('joined')),
  creator_id text not null references creators on delete cascade,
  at timestamptz not null default now()
);
create index feed_events_at_idx on public.feed_events (at);

-- ---------------------------------------------------------------------------
-- Listener activity

create table public.follows (
  user_id uuid not null references auth.users on delete cascade,
  creator_id text not null references creators on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, creator_id)
);

create table public.reactions (
  user_id uuid not null references auth.users on delete cascade,
  note_id text not null references voice_notes on delete cascade,
  kind text not null check (kind in ('🔥','❤️','🙌','🤯','💭')),
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table public.replies (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users on delete cascade,
  note_id text not null references voice_notes on delete cascade,
  text text not null check (char_length(text) between 1 and 280),
  created_at timestamptz not null default now()
);
create index replies_note_idx on public.replies (note_id, created_at);

create table public.collections (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.saved_notes (
  user_id uuid not null references auth.users on delete cascade,
  note_id text not null references voice_notes on delete cascade,
  collection_id text references collections on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table public.plays (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  note_id text not null,
  played_at timestamptz not null default now()
);
create index plays_user_idx on public.plays (user_id, played_at desc);

-- ---------------------------------------------------------------------------
-- Money (written only by the Stripe webhook with the service role)

create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  status text not null check (status in ('active', 'past_due', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.series_purchases (
  user_id uuid not null references auth.users on delete cascade,
  series_id text not null references series on delete cascade,
  started_at timestamptz not null default now(),
  stripe_session_id text,
  stripe_subscription_id text,
  primary key (user_id, series_id)
);

-- ---------------------------------------------------------------------------
-- Notifications (fan-out by a scheduled function or webhook; null user = broadcast)

create table public.notifications (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users on delete cascade,
  kind text not null check (kind in ('joined','dropped','followed_dropped','exclusive','series')),
  creator_id text references creators on delete cascade,
  note_id text references voice_notes on delete cascade,
  series_id text references series on delete cascade,
  text text not null,
  at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, at desc);

-- B2B later: private channels reuse everything above with a channel_id.
-- create table public.channels (id text primary key, name text, org text, ...);

-- ---------------------------------------------------------------------------
-- Derived counters

create or replace function public.bump_reaction_counts() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; n text;
begin
  if tg_op in ('DELETE', 'UPDATE') then
    k := old.kind; n := old.note_id;
    update voice_notes set reaction_counts = jsonb_set(reaction_counts, array[k], to_jsonb(greatest(coalesce((reaction_counts->>k)::int, 0) - 1, 0))) where id = n;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    k := new.kind; n := new.note_id;
    update voice_notes set reaction_counts = jsonb_set(reaction_counts, array[k], to_jsonb(coalesce((reaction_counts->>k)::int, 0) + 1)) where id = n;
  end if;
  return null;
end $$;

create trigger reactions_count after insert or update or delete on public.reactions
  for each row execute function public.bump_reaction_counts();

create or replace function public.bump_followers() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update creators set followers_count = followers_count + 1 where id = new.creator_id;
  else update creators set followers_count = greatest(followers_count - 1, 0) where id = old.creator_id; end if;
  return null;
end $$;

create trigger follows_count after insert or delete on public.follows
  for each row execute function public.bump_followers();

-- ---------------------------------------------------------------------------
-- Row level security

alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.sponsors enable row level security;
alter table public.series enable row level security;
alter table public.series_episodes enable row level security;
alter table public.voice_notes enable row level security;
alter table public.feed_events enable row level security;
alter table public.follows enable row level security;
alter table public.reactions enable row level security;
alter table public.replies enable row level security;
alter table public.collections enable row level security;
alter table public.saved_notes enable row level security;
alter table public.plays enable row level security;
alter table public.subscriptions enable row level security;
alter table public.series_purchases enable row level security;
alter table public.notifications enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "insert own profile" on public.profiles for insert with check (id = auth.uid() and subscription_status = 'free' and role = 'member');

-- Catalog: readable by anyone (the client times scheduled arrivals); written by admins.
-- Scheduled rows are readable so "Someone new is joining…" can be timed client-side.
-- If secrecy matters more than the teaser, restrict to published_at <= now() + interval '1 minute'.
do $$ declare t text; begin
  foreach t in array array['creators','sponsors','series','feed_events'] loop
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy "public read" on public.voice_notes for select using (true);
create policy "admin write" on public.voice_notes for all using (public.is_admin()) with check (public.is_admin());

-- Episodes: day 1 free, the rest for buyers (or free series).
create policy "episode read" on public.series_episodes for select using (
  day = 1
  or public.is_admin()
  or exists (select 1 from series s where s.id = series_id and s.price_pence = 0)
  or exists (select 1 from series_purchases p where p.series_id = series_episodes.series_id and p.user_id = auth.uid())
);
create policy "admin write" on public.series_episodes for all using (public.is_admin()) with check (public.is_admin());

do $$ declare t text; begin
  foreach t in array array['follows','reactions','collections','saved_notes','plays'] loop
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

create policy "read replies" on public.replies for select using (true);
create policy "write own replies" on public.replies for insert with check (user_id = auth.uid());
create policy "delete own replies" on public.replies for delete using (user_id = auth.uid() or public.is_admin());

create policy "own subscription" on public.subscriptions for select using (user_id = auth.uid());
create policy "own purchases" on public.series_purchases for select using (user_id = auth.uid());
create policy "own notifications" on public.notifications for select using (user_id = auth.uid() or user_id is null);
create policy "mark read" on public.notifications for update using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage. Premium audio lives in a private bucket served via signed URLs.

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('audio', 'audio', true),
  ('audio-premium', 'audio-premium', false)
on conflict (id) do nothing;

create policy "public media read" on storage.objects for select using (bucket_id in ('avatars', 'covers', 'audio'));
create policy "plus audio read" on storage.objects for select using (bucket_id = 'audio-premium' and (public.is_plus() or public.is_admin()));
create policy "admin media write" on storage.objects for insert with check (public.is_admin());
create policy "admin media update" on storage.objects for update using (public.is_admin());
create policy "admin media delete" on storage.objects for delete using (public.is_admin());
