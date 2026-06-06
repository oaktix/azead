-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    first_name text not null,
    last_name text not null,
    phone text,
    role text not null default 'user' check (role in ('user', 'admin')),
    kyc_status text not null default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),
    referral_code text unique not null,
    referred_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- WALLETS
create table public.wallets (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade unique not null,
    balance numeric(20, 2) not null default 0.00 check (balance >= 0),
    ledger_version bigint not null default 0,
    updated_at timestamptz not null default now()
);

-- WALLET TRANSACTIONS
create table public.wallet_transactions (
    id uuid primary key default uuid_generate_v4(),
    wallet_id uuid references public.wallets(id) on delete cascade not null,
    amount numeric(20, 2) not null, -- positive for credit, negative for debit
    type text not null check (type in ('deposit', 'withdrawal', 'investment_debit', 'investment_payout', 'referral_bonus')),
    reference text unique not null,
    description text not null,
    created_at timestamptz not null default now()
);

-- KYC DOCUMENTS
create table public.kyc_documents (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade unique not null,
    id_number text not null,
    id_document_url text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    admin_notes text,
    updated_at timestamptz not null default now()
);

-- INVESTMENT PACKAGES
create table public.investment_packages (
    id uuid primary key default uuid_generate_v4(),
    name text unique not null,
    amount numeric(20, 2) not null check (amount > 0),
    annual_interest_rate numeric(5, 2) not null default 25.00 check (annual_interest_rate >= 0),
    duration_days integer not null default 365,
    is_active boolean not null default true
);

-- INVESTMENTS
create table public.investments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    package_id uuid references public.investment_packages(id) not null,
    amount numeric(20, 2) not null check (amount > 0),
    interest_rate numeric(5, 2) not null,
    status text not null default 'active' check (status in ('active', 'completed', 'early_termination_pending', 'early_terminated')),
    start_date timestamptz not null default now(),
    maturity_date timestamptz not null,
    auto_reinvest boolean not null default false,
    last_accrual_date timestamptz not null default now(),
    accrued_interest numeric(20, 4) not null default 0.0000
);

-- WITHDRAWALS
create table public.withdrawals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount numeric(20, 2) not null check (amount > 0), -- gross amount requested
    fee numeric(20, 2) not null check (fee >= 0), -- 1.9% processing fee
    payout_amount numeric(20, 2) not null check (payout_amount > 0), -- amount - fee
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    bank_name text not null,
    account_number text not null,
    account_name text not null,
    rejection_reason text,
    processed_by uuid references public.profiles(id) on delete set null,
    processed_at timestamptz,
    created_at timestamptz not null default now()
);

-- DEPOSITS
create table public.deposits (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount numeric(20, 2) not null check (amount > 0),
    reference text unique not null,
    provider text not null default 'transactpay',
    status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
    raw_response jsonb,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

-- REFERRALS
create table public.referrals (
    id uuid primary key default uuid_generate_v4(),
    referrer_id uuid references public.profiles(id) on delete cascade not null,
    referee_id uuid references public.profiles(id) on delete cascade unique not null, -- One referee can only be referred by one person
    created_at timestamptz not null default now()
);

-- REFERRAL REWARDS
create table public.referral_rewards (
    id uuid primary key default uuid_generate_v4(),
    referrer_id uuid references public.profiles(id) on delete cascade not null,
    referee_id uuid references public.profiles(id) on delete cascade not null,
    investment_id uuid references public.investments(id) on delete cascade not null,
    reward_amount numeric(20, 2) not null check (reward_amount > 0),
    status text not null default 'paid' check (status in ('paid', 'pending')),
    created_at timestamptz not null default now()
);

-- PLATFORM SETTINGS
create table public.platform_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

-- LIQUIDITY CONTROLS
create table public.liquidity_controls (
    id uuid primary key default uuid_generate_v4(),
    total_platform_deposits numeric(20, 2) not null default 0.00,
    total_platform_withdrawals numeric(20, 2) not null default 0.00,
    panic_button_paused boolean not null default false,
    daily_withdrawal_limit numeric(20, 2) not null default 100000000.00, -- 100M NGN limit default
    updated_at timestamptz not null default now()
);

-- ADMIN LOGS
create table public.admin_logs (
    id uuid primary key default uuid_generate_v4(),
    admin_id uuid references public.profiles(id) on delete set null,
    action text not null,
    details jsonb,
    ip_address text,
    created_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table public.notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    message text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- INDEXES FOR PERFORMANCE
create index idx_profiles_referred_by on public.profiles(referred_by);
create index idx_wallet_transactions_wallet_id on public.wallet_transactions(wallet_id);
create index idx_investments_user_id on public.investments(user_id);
create index idx_investments_status on public.investments(status);
create index idx_withdrawals_user_id on public.withdrawals(user_id);
create index idx_withdrawals_status on public.withdrawals(status);
create index idx_deposits_user_id on public.deposits(user_id);
create index idx_deposits_reference on public.deposits(reference);
create index idx_referrals_referrer_id on public.referrals(referrer_id);
create index idx_referral_rewards_referrer_id on public.referral_rewards(referrer_id);
create index idx_notifications_user_id_read on public.notifications(user_id, is_read);

-- ROW LEVEL SECURITY (RLS) policies

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.investment_packages enable row level security;
alter table public.investments enable row level security;
alter table public.withdrawals enable row level security;
alter table public.deposits enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.platform_settings enable row level security;
alter table public.liquidity_controls enable row level security;
alter table public.admin_logs enable row level security;
alter table public.notifications enable row level security;

-- HELPER FUNCTION FOR RLS (Prevents infinite recursion on profiles table)
create or replace function public.is_admin()
returns boolean security definer as $$
begin
    return exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
end;
$$ language plpgsql;

-- RLS POLICIES FOR PROFILES
create policy "Users can view their own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users can update their own profile fields" on public.profiles
    for update using (auth.uid() = id);

create policy "Admins can do everything on profiles" on public.profiles
    for all using (public.is_admin());

-- RLS POLICIES FOR WALLETS
create policy "Users can view their own wallet" on public.wallets
    for select using (auth.uid() = user_id);

create policy "Admins can view all wallets" on public.wallets
    for select using (public.is_admin());

-- RLS POLICIES FOR WALLET TRANSACTIONS
create policy "Users can view their own wallet transactions" on public.wallet_transactions
    for select using (
        exists (
            select 1 from public.wallets
            where wallets.id = wallet_transactions.wallet_id and wallets.user_id = auth.uid()
        )
    );

create policy "Admins can view all wallet transactions" on public.wallet_transactions
    for select using (public.is_admin());

-- RLS POLICIES FOR KYC DOCUMENTS
create policy "Users can view their own KYC docs" on public.kyc_documents
    for select using (auth.uid() = user_id);

create policy "Users can insert their own KYC docs" on public.kyc_documents
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own pending KYC docs" on public.kyc_documents
    for update using (auth.uid() = user_id and status = 'pending');

create policy "Admins can do everything on KYC docs" on public.kyc_documents
    for all using (public.is_admin());

-- RLS POLICIES FOR INVESTMENT PACKAGES
create policy "Anyone can view active investment packages" on public.investment_packages
    for select using (is_active = true);

create policy "Admins can do everything on investment packages" on public.investment_packages
    for all using (public.is_admin());

-- RLS POLICIES FOR INVESTMENTS
create policy "Users can view their own investments" on public.investments
    for select using (auth.uid() = user_id);

create policy "Admins can do everything on investments" on public.investments
    for all using (public.is_admin());

-- RLS POLICIES FOR WITHDRAWALS
create policy "Users can view their own withdrawals" on public.withdrawals
    for select using (auth.uid() = user_id);

create policy "Users can request withdrawals" on public.withdrawals
    for insert with check (auth.uid() = user_id);

create policy "Admins can do everything on withdrawals" on public.withdrawals
    for all using (public.is_admin());

-- RLS POLICIES FOR DEPOSITS
create policy "Users can view their own deposits" on public.deposits
    for select using (auth.uid() = user_id);

create policy "Users can create deposit logs" on public.deposits
    for insert with check (auth.uid() = user_id);

create policy "Admins can do everything on deposits" on public.deposits
    for all using (public.is_admin());

-- RLS POLICIES FOR REFERRALS
create policy "Users can view referrals where they are involved" on public.referrals
    for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

create policy "Users can create referral mappings during signup" on public.referrals
    for insert with check (auth.uid() = referee_id);

create policy "Admins can view all referrals" on public.referrals
    for select using (public.is_admin());

-- RLS POLICIES FOR REFERRAL REWARDS
create policy "Users can view their earned referral rewards" on public.referral_rewards
    for select using (auth.uid() = referrer_id);

create policy "Admins can view all referral rewards" on public.referral_rewards
    for select using (public.is_admin());

-- RLS POLICIES FOR PLATFORM SETTINGS
create policy "Anyone can view platform settings" on public.platform_settings
    for select using (true);

create policy "Admins can manage platform settings" on public.platform_settings
    for all using (public.is_admin());

-- RLS POLICIES FOR LIQUIDITY CONTROLS
create policy "Admins can manage liquidity controls" on public.liquidity_controls
    for all using (public.is_admin());

-- RLS POLICIES FOR ADMIN LOGS
create policy "Admins can view admin logs" on public.admin_logs
    for select using (public.is_admin());

-- RLS POLICIES FOR NOTIFICATIONS
create policy "Users can view their own notifications" on public.notifications
    for select using (auth.uid() = user_id);

create policy "Users can update their own notifications (read status)" on public.notifications
    for update using (auth.uid() = user_id);



-- PL/pgSQL ATOMIC LEDGER FUNCTIONS

-- Function to handle user wallet and profile creation on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
    v_referred_by_id uuid := null;
    v_ref_code text;
    v_referred_by_code text;
begin
    -- 1. Create referral code for user (first 6 characters of id + random)
    v_ref_code := lower(substring(replace(new.id::text, '-', '') from 1 for 8));
    
    -- 2. Extract referrer if code was passed in metadata
    v_referred_by_code := (new.raw_user_meta_data->>'referred_by');
    if v_referred_by_code is not null then
        select id into v_referred_by_id from public.profiles
        where referral_code = v_referred_by_code;
    end if;

    -- 3. Insert into profiles
    insert into public.profiles (id, first_name, last_name, phone, role, referral_code, referred_by)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'first_name', 'User'),
        coalesce(new.raw_user_meta_data->>'last_name', ''),
        new.raw_user_meta_data->>'phone',
        'user',
        v_ref_code,
        v_referred_by_id
    );

    -- 4. Create wallet for user
    insert into public.wallets (user_id, balance)
    values (new.id, 0.00);

    -- 5. Record referral relation if code was valid
    if v_referred_by_id is not null then
        insert into public.referrals (referrer_id, referee_id)
        values (v_referred_by_id, new.id);
    end if;

    return new;
end;
$$ language plpgsql security definer;

-- Trigger to automate signup handling
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- Function to purchase an investment package atomically
create or replace function public.purchase_investment(
    p_user_id uuid,
    p_package_id uuid,
    p_auto_reinvest boolean
)
returns uuid as $$
declare
    v_wallet_id uuid;
    v_balance numeric(20, 2);
    v_pkg_amount numeric(20, 2);
    v_pkg_name text;
    v_pkg_interest numeric(5, 2);
    v_pkg_duration integer;
    v_investment_id uuid;
    v_referrer_id uuid;
    v_referral_reward_amount numeric(20, 2);
    v_referral_wallet_id uuid;
    v_existing_investments_count bigint;
begin
    -- 1. Get package details
    select name, amount, annual_interest_rate, duration_days
    into v_pkg_name, v_pkg_amount, v_pkg_interest, v_pkg_duration
    from public.investment_packages
    where id = p_package_id and is_active = true;

    if v_pkg_amount is null then
        raise exception 'Investment package not found or inactive';
    end if;

    -- 2. Lock user wallet and check balance
    select id, balance into v_wallet_id, v_balance
    from public.wallets
    where user_id = p_user_id
    for update;

    if v_balance < v_pkg_amount then
        raise exception 'Insufficient wallet balance. Package requires % NGN, but balance is % NGN', v_pkg_amount, v_balance;
    end if;

    -- 3. Deduct from user wallet
    update public.wallets
    set balance = balance - v_pkg_amount,
        ledger_version = ledger_version + 1,
        updated_at = now()
    where id = v_wallet_id;

    -- 4. Create ledger transaction entry
    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
    values (
        v_wallet_id,
        -v_pkg_amount,
        'investment_debit',
        'INV-SUB-' || encode(uuid_send(uuid_generate_v4()), 'hex'),
        'Subscribed to package: ' || v_pkg_name
    );

    -- 5. Create investment record
    insert into public.investments (user_id, package_id, amount, interest_rate, status, start_date, maturity_date, auto_reinvest)
    values (
        p_user_id,
        p_package_id,
        v_pkg_amount,
        v_pkg_interest,
        'active',
        now(),
        now() + (v_pkg_duration || ' days')::interval,
        p_auto_reinvest
    )
    returning id into v_investment_id;

    -- 6. Referral Commission System: 2.5% on the referee's FIRST successful investment
    -- Check if this is the user's first investment
    select count(*) into v_existing_investments_count
    from public.investments
    where user_id = p_user_id;

    if v_existing_investments_count = 1 then
        -- Check if user was referred by someone
        select referred_by into v_referrer_id
        from public.profiles
        where id = p_user_id;

        if v_referrer_id is not null then
            v_referral_reward_amount := v_pkg_amount * 0.025; -- 2.5% of package amount

            -- Lock referrer wallet and pay reward
            select id into v_referral_wallet_id
            from public.wallets
            where user_id = v_referrer_id
            for update;

            if v_referral_wallet_id is not null then
                -- Add to referrer wallet
                update public.wallets
                set balance = balance + v_referral_reward_amount,
                    ledger_version = ledger_version + 1,
                    updated_at = now()
                where id = v_referral_wallet_id;

                -- Create referrer transaction entry
                insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
                values (
                    v_referral_wallet_id,
                    v_referral_reward_amount,
                    'referral_bonus',
                    'REF-BON-' || encode(uuid_send(uuid_generate_v4()), 'hex'),
                    'Referral bonus from first investment of referee'
                );

                -- Log in referral rewards
                insert into public.referral_rewards (referrer_id, referee_id, investment_id, reward_amount, status)
                values (
                    v_referrer_id,
                    p_user_id,
                    v_investment_id,
                    v_referral_reward_amount,
                    'paid'
                );

                -- Send notification to referrer
                insert into public.notifications (user_id, title, message)
                values (
                    v_referrer_id,
                    'Referral Reward Paid!',
                    'You have received ' || v_referral_reward_amount || ' NGN referral bonus for referring a user who subscribed to a package.'
                );
            end if;
        end if;
    end if;

    -- Send notification to subscriber
    insert into public.notifications (user_id, title, message)
    values (
        p_user_id,
        'Investment Subscribed!',
        'You have successfully subscribed to the ' || v_pkg_name || ' investment package for ' || v_pkg_amount || ' NGN.'
    );

    return v_investment_id;
end;
$$ language plpgsql security definer;


-- Function to record and process a successful deposit callback atomically
create or replace function public.process_successful_deposit(
    p_user_id uuid,
    p_amount numeric,
    p_reference text,
    p_raw_response jsonb
)
returns boolean as $$
declare
    v_wallet_id uuid;
    v_deposit_status text;
    v_deposit_id uuid;
begin
    -- 1. Check if deposit is already processed
    select id, status into v_deposit_id, v_deposit_status
    from public.deposits
    where reference = p_reference;

    if v_deposit_id is not null then
        if v_deposit_status = 'success' then
            return true; -- Already processed successfully
        end if;
    else
        -- Insert a record as pending first to be updated
        insert into public.deposits (user_id, amount, reference, provider, status, raw_response, created_at)
        values (p_user_id, p_amount, p_reference, 'transactpay', 'pending', p_raw_response, now())
        returning id into v_deposit_id;
    end if;

    -- 2. Lock user wallet
    select id into v_wallet_id
    from public.wallets
    where user_id = p_user_id
    for update;

    if v_wallet_id is null then
        raise exception 'User wallet not found';
    end if;

    -- 3. Credit wallet balance
    update public.wallets
    set balance = balance + p_amount,
        ledger_version = ledger_version + 1,
        updated_at = now()
    where id = v_wallet_id;

    -- 4. Create ledger transaction record
    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
    values (
        v_wallet_id,
        p_amount,
        'deposit',
        p_reference,
        'Deposited ' || p_amount || ' NGN via Transactpay'
    );

    -- 5. Update deposit status to success
    update public.deposits
    set status = 'success',
        completed_at = now(),
        raw_response = p_raw_response
    where id = v_deposit_id;

    -- Update Platform Liquidity
    insert into public.liquidity_controls (total_platform_deposits, total_platform_withdrawals)
    values (p_amount, 0.00)
    on conflict do update set
        total_platform_deposits = public.liquidity_controls.total_platform_deposits + p_amount,
        updated_at = now();

    -- Notify user
    insert into public.notifications (user_id, title, message)
    values (
        p_user_id,
        'Deposit Credited!',
        'Your wallet has been credited with ' || p_amount || ' NGN.'
    );

    return true;
end;
$$ language plpgsql security definer;


-- Function to request early termination of an investment
create or replace function public.request_early_termination(
    p_user_id uuid,
    p_investment_id uuid
)
returns boolean as $$
declare
    v_status text;
begin
    -- 1. Check if investment is active and belongs to user
    select status into v_status
    from public.investments
    where id = p_investment_id and user_id = p_user_id;

    if v_status is null then
        raise exception 'Investment not found';
    end if;

    if v_status != 'active' then
        raise exception 'Only active investments can be terminated early';
    end if;

    -- 2. Mark investment status as early termination pending
    update public.investments
    set status = 'early_termination_pending'
    where id = p_investment_id;

    -- Send notification
    insert into public.notifications (user_id, title, message)
    values (
        p_user_id,
        'Early Termination Requested',
        'Your request for early termination of your investment has been received. This will process with a 10% penalty after admin review.'
    );

    return true;
end;
$$ language plpgsql security definer;


-- Function for admin to process/approve early termination
create or replace function public.approve_early_termination(
    p_investment_id uuid,
    p_admin_id uuid
)
returns boolean as $$
declare
    v_user_id uuid;
    v_amount numeric(20, 2);
    v_wallet_id uuid;
    v_penalty numeric(20, 2);
    v_payout numeric(20, 2);
    v_ref_debit text;
    v_ref_payout text;
begin
    -- 1. Lock and retrieve investment details
    select user_id, amount into v_user_id, v_amount
    from public.investments
    where id = p_investment_id and status = 'early_termination_pending'
    for update;

    if v_user_id is null then
        raise exception 'Pending early termination request not found';
    end if;

    -- Calculate penalty (10%) and payout
    v_penalty := v_amount * 0.10;
    v_payout := v_amount - v_penalty;

    -- 2. Lock user wallet
    select id into v_wallet_id
    from public.wallets
    where user_id = v_user_id
    for update;

    -- 3. Return payout (90%) to wallet
    update public.wallets
    set balance = balance + v_payout,
        ledger_version = ledger_version + 1,
        updated_at = now()
    where id = v_wallet_id;

    -- 4. Record payout transaction in ledger
    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
    values (
        v_wallet_id,
        v_payout,
        'investment_payout',
        'INV-TERM-' || encode(uuid_send(p_investment_id), 'hex'),
        'Early termination payout of package. 10% penalty applied: ' || v_penalty || ' NGN'
    );

    -- 5. Mark investment completed
    update public.investments
    set status = 'early_terminated',
        accrued_interest = 0.00,
        maturity_date = now()
    where id = p_investment_id;

    -- Log admin action
    insert into public.admin_logs (admin_id, action, details)
    values (
        p_admin_id,
        'approve_early_termination',
        jsonb_build_object('investment_id', p_investment_id, 'amount', v_amount, 'payout', v_payout, 'penalty', v_penalty)
    );

    -- Notify user
    insert into public.notifications (user_id, title, message)
    values (
        v_user_id,
        'Early Termination Approved',
        'Your early termination request has been approved. ' || v_payout || ' NGN (after 10% penalty) has been credited to your wallet.'
    );

    return true;
end;
$$ language plpgsql security definer;


-- Function to request a withdrawal atomically
create or replace function public.request_withdrawal(
    p_user_id uuid,
    p_amount numeric,
    p_bank_name text,
    p_account_number text,
    p_account_name text
)
returns uuid as $$
declare
    v_wallet_id uuid;
    v_balance numeric(20, 2);
    v_fee numeric(20, 2);
    v_payout numeric(20, 2);
    v_withdrawal_id uuid;
begin
    -- 1. Lock user wallet and check balance
    select id, balance into v_wallet_id, v_balance
    from public.wallets
    where user_id = p_user_id
    for update;

    if v_balance < p_amount then
        raise exception 'Insufficient balance to request withdrawal of % NGN. Current balance is % NGN', p_amount, v_balance;
    end if;

    -- Calculate fee (1.9% of requested withdrawal amount)
    v_fee := p_amount * 0.019;
    v_payout := p_amount - v_fee;

    -- 2. Deduct full requested amount from user wallet
    update public.wallets
    set balance = balance - p_amount,
        ledger_version = ledger_version + 1,
        updated_at = now()
    where id = v_wallet_id;

    -- 3. Insert withdrawal request
    insert into public.withdrawals (user_id, amount, fee, payout_amount, status, bank_name, account_number, account_name)
    values (
        p_user_id,
        p_amount,
        v_fee,
        v_payout,
        'pending',
        p_bank_name,
        p_account_number,
        p_account_name
    )
    returning id into v_withdrawal_id;

    -- 4. Create ledger transaction (Debiting wallet)
    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
    values (
        v_wallet_id,
        -p_amount,
        'withdrawal',
        'WTH-REQ-' || encode(uuid_send(v_withdrawal_id), 'hex'),
        'Withdrawal request pending admin approval. Net payout: ' || v_payout || ' NGN (1.9% fee: ' || v_fee || ' NGN)'
    );

    -- Notify user
    insert into public.notifications (user_id, title, message)
    values (
        p_user_id,
        'Withdrawal Requested',
        'Your withdrawal request of ' || p_amount || ' NGN is pending admin approval.'
    );

    return v_withdrawal_id;
end;
$$ language plpgsql security definer;


-- Function to approve a withdrawal request
create or replace function public.approve_withdrawal(
    p_withdrawal_id uuid,
    p_admin_id uuid
)
returns boolean as $$
declare
    v_user_id uuid;
    v_amount numeric(20, 2);
    v_payout_amount numeric(20, 2);
    v_status text;
begin
    -- 1. Retrieve withdrawal and lock row
    select user_id, amount, payout_amount, status
    into v_user_id, v_amount, v_payout_amount, v_status
    from public.withdrawals
    where id = p_withdrawal_id
    for update;

    if v_status is null then
        raise exception 'Withdrawal request not found';
    end if;

    if v_status != 'pending' then
        raise exception 'Withdrawal request is not pending';
    end if;

    -- 2. Mark withdrawal as approved
    update public.withdrawals
    set status = 'approved',
        processed_by = p_admin_id,
        processed_at = now()
    where id = p_withdrawal_id;

    -- Update platform analytics
    insert into public.liquidity_controls (total_platform_deposits, total_platform_withdrawals)
    values (0.00, v_payout_amount)
    on conflict do update set
        total_platform_withdrawals = public.liquidity_controls.total_platform_withdrawals + v_payout_amount,
        updated_at = now();

    -- Log admin action
    insert into public.admin_logs (admin_id, action, details)
    values (
        p_admin_id,
        'approve_withdrawal',
        jsonb_build_object('withdrawal_id', p_withdrawal_id, 'amount', v_amount, 'payout_amount', v_payout_amount)
    );

    -- Notify user
    insert into public.notifications (user_id, title, message)
    values (
        v_user_id,
        'Withdrawal Approved!',
        'Your withdrawal of ' || v_amount || ' NGN (Net: ' || v_payout_amount || ' NGN) has been approved and processed to your bank.'
    );

    return true;
end;
$$ language plpgsql security definer;


-- Function to reject a withdrawal request (refunds the user's wallet)
create or replace function public.reject_withdrawal(
    p_withdrawal_id uuid,
    p_admin_id uuid,
    p_rejection_reason text
)
returns boolean as $$
declare
    v_user_id uuid;
    v_amount numeric(20, 2);
    v_status text;
    v_wallet_id uuid;
begin
    -- 1. Retrieve withdrawal and lock row
    select user_id, amount, status
    into v_user_id, v_amount, v_status
    from public.withdrawals
    where id = p_withdrawal_id
    for update;

    if v_status is null then
        raise exception 'Withdrawal request not found';
    end if;

    if v_status != 'pending' then
        raise exception 'Withdrawal request is not pending';
    end if;

    -- 2. Lock user wallet
    select id into v_wallet_id
    from public.wallets
    where user_id = v_user_id
    for update;

    -- 3. Return funds to wallet
    update public.wallets
    set balance = balance + v_amount,
        ledger_version = ledger_version + 1,
        updated_at = now()
    where id = v_wallet_id;

    -- 4. Record refund in ledger
    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
    values (
        v_wallet_id,
        v_amount,
        'deposit', -- treating refund as credit type
        'WTH-REF-' || encode(uuid_send(p_withdrawal_id), 'hex'),
        'Refund for rejected withdrawal request. Reason: ' || coalesce(p_rejection_reason, 'None provided')
    );

    -- 5. Mark withdrawal as rejected
    update public.withdrawals
    set status = 'rejected',
        rejection_reason = p_rejection_reason,
        processed_by = p_admin_id,
        processed_at = now()
    where id = p_withdrawal_id;

    -- Log admin action
    insert into public.admin_logs (admin_id, action, details)
    values (
        p_admin_id,
        'reject_withdrawal',
        jsonb_build_object('withdrawal_id', p_withdrawal_id, 'amount', v_amount, 'reason', p_rejection_reason)
    );

    -- Notify user
    insert into public.notifications (user_id, title, message)
    values (
        v_user_id,
        'Withdrawal Rejected',
        'Your withdrawal request of ' || v_amount || ' NGN has been rejected. Reason: ' || coalesce(p_rejection_reason, 'None')
    );

    return true;
end;
$$ language plpgsql security definer;


-- Function to process matured investments (runs via scheduler/cron or manual triggers)
create or replace function public.process_matured_investments()
returns integer as $$
declare
    v_rec record;
    v_wallet_id uuid;
    v_accrued_payout numeric(20, 2);
    v_processed_count integer := 0;
begin
    for v_rec in 
        select i.id, i.user_id, i.amount, i.interest_rate, i.package_id, i.auto_reinvest, ip.name as package_name
        from public.investments i
        join public.investment_packages ip on i.package_id = ip.id
        where i.status = 'active' and i.maturity_date <= now()
    loop
        -- 1. Calculate payout amount (principal + 25% interest rate * 1 year)
        -- Interest rate is annual, e.g. 25.00
        v_accrued_payout := v_rec.amount + (v_rec.amount * (v_rec.interest_rate / 100));

        -- 2. Lock user wallet
        select id into v_wallet_id
        from public.wallets
        where user_id = v_rec.user_id
        for update;

        if v_wallet_id is not null then
            -- Check if user wants auto-reinvest
            if v_rec.auto_reinvest then
                -- Pay out ONLY interest, and reinvest principal automatically
                declare
                    v_interest_payout numeric(20, 2) := v_rec.amount * (v_rec.interest_rate / 100);
                begin
                    -- Add interest to wallet
                    update public.wallets
                    set balance = balance + v_interest_payout,
                        ledger_version = ledger_version + 1,
                        updated_at = now()
                    where id = v_wallet_id;

                    -- Record interest payout in ledger
                    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
                    values (
                        v_wallet_id,
                        v_interest_payout,
                        'investment_payout',
                        'INV-INT-' || encode(uuid_send(v_rec.id), 'hex'),
                        'Accrued interest payout for package: ' || v_rec.package_name
                    );

                    -- Reset investment start/maturity dates to roll it over
                    update public.investments
                    set start_date = now(),
                        maturity_date = now() + (365 || ' days')::interval,
                        last_accrual_date = now(),
                        accrued_interest = 0.00
                    where id = v_rec.id;

                    -- Notify user
                    insert into public.notifications (user_id, title, message)
                    values (
                        v_rec.user_id,
                        'Investment Auto-Reinvested!',
                        'Your ' || v_rec.package_name || ' investment matured. Your interest of ' || v_interest_payout || ' NGN has been paid, and your capital of ' || v_rec.amount || ' NGN has been rolled over.'
                    );
                end;
            else
                -- Pay out both capital and interest
                update public.wallets
                set balance = balance + v_accrued_payout,
                    ledger_version = ledger_version + 1,
                    updated_at = now()
                where id = v_wallet_id;

                -- Record payout in ledger
                insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
                values (
                    v_wallet_id,
                    v_accrued_payout,
                    'investment_payout',
                    'INV-PAY-' || encode(uuid_send(v_rec.id), 'hex'),
                    'Full maturity payout (capital + interest) for package: ' || v_rec.package_name
                );

                -- Mark investment as completed
                update public.investments
                set status = 'completed',
                    accrued_interest = v_rec.amount * (v_rec.interest_rate / 100),
                    last_accrual_date = now()
                where id = v_rec.id;

                -- Notify user
                insert into public.notifications (user_id, title, message)
                values (
                    v_rec.user_id,
                    'Investment Matured!',
                    'Your ' || v_rec.package_name || ' investment has matured. ' || v_accrued_payout || ' NGN has been paid into your wallet.'
                );
            end if;

            v_processed_count := v_processed_count + 1;
        end if;
    end loop;

    return v_processed_count;
end;
$$ language plpgsql security definer;


-- Seed default investment packages
insert into public.investment_packages (name, amount, annual_interest_rate, duration_days, is_active)
values 
    ('Basic', 500000.00, 25.00, 365, true),
    ('Standard', 1000000.00, 25.00, 365, true),
    ('Silver', 5000000.00, 25.00, 365, true),
    ('Gold', 10000000.00, 25.00, 365, true),
    ('Diamond', 20000000.00, 25.00, 365, true),
    ('VIP', 50000000.00, 25.00, 365, true)
on conflict (name) do update set
    amount = excluded.amount,
    annual_interest_rate = excluded.annual_interest_rate,
    duration_days = excluded.duration_days,
    is_active = excluded.is_active;

-- Seed platform settings
insert into public.platform_settings (key, value)
values
    ('withdrawal_fee_percentage', '1.9'::jsonb),
    ('early_termination_penalty_percentage', '10.0'::jsonb),
    ('referral_bonus_percentage', '2.5'::jsonb)
on conflict (key) do nothing;

-- Initialize Liquidity Controls
insert into public.liquidity_controls (id, total_platform_deposits, total_platform_withdrawals, panic_button_paused)
values ('00000000-0000-0000-0000-000000000001', 0.00, 0.00, false)
on conflict do nothing;
