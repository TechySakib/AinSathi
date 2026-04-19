-- ════════════════════════════════════════════════════════════════
--  AinSathi — Supabase Database Schema
--  Run this in your Supabase project → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════

-- ─── Enable UUID extension (already on by default in Supabase) ───
create extension if not exists "uuid-ossp";


-- ════════════════════════════════════════════════════════════════
--  1. PROFILES  (extended user info, auto-created on signup)
-- ════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ════════════════════════════════════════════════════════════════
--  2. CONVERSATIONS
-- ════════════════════════════════════════════════════════════════
create table if not exists public.conversations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New Conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists conversations_user_id_idx
  on public.conversations(user_id, updated_at desc);

-- Row Level Security
alter table public.conversations enable row level security;

create policy "Users can read their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════
--  3. MESSAGES
-- ════════════════════════════════════════════════════════════════
create table if not exists public.messages (
  id                uuid primary key default uuid_generate_v4(),
  conversation_id   uuid not null references public.conversations(id) on delete cascade,
  role              text not null check (role in ('user', 'assistant')),
  content           text not null,
  created_at        timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
  on public.messages(conversation_id, created_at asc);

-- Row Level Security  (users can only reach messages via their own conversations)
alter table public.messages enable row level security;

create policy "Users can read their own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can insert their own messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can delete their own messages"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════════
--  4.  auto-update `updated_at` on conversations when a new
--      message is inserted
-- ════════════════════════════════════════════════════════════════
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_inserted on public.messages;
create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.touch_conversation();
