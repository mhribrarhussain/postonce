# Supabase Setup Guide (From Zero to Live)

Follow these exact steps to connect your "PostOnce" app to a live backend.

## Phase 1: Create the Project

1.  Go to [https://supabase.com/](https://supabase.com/).
2.  Click **"Start your project"** and sign in (GitHub login is easiest).
3.  Click **"New Project"**.
4.  Select an Organization (create one if needed, e.g., "My Org").
5.  **Name**: `PostOnce`
6.  **Database Password**: Generate a strong password and **SAVE IT** somewhere safe.
7.  **Region**: Choose the one closest to you (e.g., East US, London, Mumbai).
8.  Click **"Create new project"**.
    *   *Wait about 1-2 minutes for the database to set up.*

## Phase 2: Get Your API Keys

Once the project is "Active" (Green):

1.  Look at the left sidebar, click **Project Settings** (the cog/gear icon ⚙️ at the bottom).
2.  Click **"API"** in the list.
3.  **Project URL**: Copy this URL (e.g., `https://xyzabc.supabase.co`).
4.  **Project API Keys (anon public)**: Copy the key labeled `anon` `public`.
    *   *Warning: Do NOT copy the `service_role` key.*

### 🟢 ACTION: Update Your Code
1.  Open the file `js/supabase.js` on your computer.
2.  Paste the **Project URL** into the `SUPABASE_URL` variable.
3.  Paste the **anon key** into the `SUPABASE_ANON_KEY` variable.
4.  Save the file.

## Phase 3: Setup the Database (Tables)

1.  Go back to Supabase Dashboard.
2.  Click **"SQL Editor"** in the left sidebar (icon looks like a terminal `>_`).
3.  Click **"+ New Query"**.
4.  Copy the code below entirely:

```sql
-- 1. Create PROFILES table
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
  platform text not null,
  platform_account_id text not null,
  account_name text,
  access_token text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create POSTS table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  content text,
  media_urls jsonb default '[]'::jsonb,
  scheduled_time timestamp with time zone,
  status text default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Security (RLS)
alter table public.profiles enable row level security;
alter table public.social_accounts enable row level security;
alter table public.posts enable row level security;

-- 5. Create Access Policies
create policy "Users can CRUD own social accounts" on social_accounts for all using (auth.uid() = user_id);
create policy "Users can CRUD own posts" on posts for all using (auth.uid() = user_id);
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);

-- 6. Trigger for New Users
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
```

5.  Paste it into the SQL Editor.
6.  Click **"Run"** (Green button, bottom right).
    *   *You should see "Success" in the results.*

## Phase 4: Configure Authentication

1.  Click **"Authentication"** in the left sidebar (icon looks like a group of users).
2.  Click **"Providers"**.
3.  Ensure **"Email"** is Enabled (it is by default).
4.  (Optional) **Disable "Confirm Email"** for faster testing:
    *   Go to Auth -> **URL Configuration** (or Site URL).
    *   Basically, allows you to login immediately without clicking an email link.
    *   *Note: For production, keep email confirmation ON.*

## Phase 5: Test It!

1.  Open your website `index.html` (or `auth.html`).
2.  Click **"Get Started Free"** or **"Sign Up"**.
3.  Enter an email and password.
4.  Click Sign Up.
    *   If successful, it should redirect you to `dashboard.html`.
    *   If you check the **Table Editor** in Supabase, you will see a new row in the `profiles` table!

You are now live! 🚀
