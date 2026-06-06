-- Migration for Supabase tables

-- Users table (represents authenticated users)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  first_name text,
  last_name text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Wallets table (one per user)
create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  balance numeric not null default 0,
  created_at timestamp with time zone default now()
);

-- Transactions table (deposits/withdrawals)
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid references public.wallets(id) on delete cascade,
  type text check (type in ('deposit', 'withdraw')),
  amount numeric not null,
  reference text,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  created_at timestamp with time zone default now()
);

-- Investments table

-- Profiles table (stores user profile and role)
create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.investments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  package_id uuid,
  amount numeric not null,
  status text check (status in ('active', 'terminated')) default 'active',
  created_at timestamp with time zone default now(),
  terminated_at timestamp with time zone
);

-- Referrals table

-- Enable RLS policies for admin access
alter table public.profiles enable row level security;
create policy "admin can select all" on public.profiles for select using (auth.role() = 'admin');
create policy "admin can update own" on public.profiles for update using (auth.role() = 'admin' and auth.uid() = id);

create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references public.users(id) on delete cascade,
  referred_user_id uuid references public.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- KYC table
create table if not exists public.kyc (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  id_number text,
  document_url text,
  status text check (status in ('pending', 'verified', 'rejected')) default 'pending',
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable row level security (RLS) for all tables (optional)
alter table public.users enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;
alter table public.referrals enable row level security;
alter table public.kyc enable row level security;

-- Basic policies (allow authenticated users to operate on their own rows)
create policy "allow select own" on public.users for select using (auth.uid() = id);
create policy "allow update own" on public.users for update using (auth.uid() = id);
create policy "allow insert" on public.users for insert with check (true);

-- Similar policies can be added for other tables as needed.
