-- 1. Create PROFILES table (Public profile info)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  plan_tier text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create SOCIAL_ACCOUNTS table
create table public.social_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  platform text not null check (platform in ('facebook', 'linkedin', 'instagram', 'twitter')),
  platform_account_id text not null,
  account_name text,
  access_token text, -- NOTE: For MVP we store here. Prod should use Vault.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create POSTS table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  content text,
  media_urls jsonb default '[]'::jsonb,
  scheduled_time timestamp with time zone,
  status text default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.social_accounts enable row level security;
alter table public.posts enable row level security;

-- 5. Create Policies (Users can only see/edit their OWN data)

-- Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Social Accounts
create policy "Users can CRUD own social accounts" on social_accounts for all using (auth.uid() = user_id);

-- Posts
create policy "Users can CRUD own posts" on posts for all using (auth.uid() = user_id);

-- 6. Auto-create Profile on Sign Up (Trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
