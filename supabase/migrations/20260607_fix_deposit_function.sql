-- Migration: Fix process_successful_deposit function
-- Problem: The liquidity_controls table uses a uuid PK, not a single-row singleton.
-- The ON CONFLICT DO UPDATE clause had no conflict target, causing a Postgres error:
--   "ON CONFLICT DO UPDATE requires inference specification or constraint name"
-- Fix: Declare v_liquidity_rows in the main DECLARE block and use IF/UPDATE/INSERT.

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
    v_liquidity_rows int;
begin
    -- 1. Check if deposit is already processed (idempotency guard)
    select id, status into v_deposit_id, v_deposit_status
    from public.deposits
    where reference = p_reference;

    if v_deposit_id is not null then
        if v_deposit_status = 'success' then
            return true; -- Already processed successfully, safe to ack
        end if;
    else
        -- Insert a pending deposit record first so we can update it later
        insert into public.deposits (user_id, amount, reference, provider, status, raw_response, created_at)
        values (p_user_id, p_amount, p_reference, 'transactpay', 'pending', p_raw_response, now())
        returning id into v_deposit_id;
    end if;

    -- 2. Lock the user's wallet row to prevent concurrent credits
    select id into v_wallet_id
    from public.wallets
    where user_id = p_user_id
    for update;

    if v_wallet_id is null then
        raise exception 'Wallet not found for user %', p_user_id;
    end if;

    -- 3. Credit wallet balance atomically
    update public.wallets
    set balance = balance + p_amount,
        ledger_version = ledger_version + 1,
        updated_at = now()
    where id = v_wallet_id;

    -- 4. Record the credit in the wallet transaction ledger
    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
    values (
        v_wallet_id,
        p_amount,
        'deposit',
        p_reference,
        'Deposited ' || p_amount || ' NGN via Transactpay'
    );

    -- 5. Mark deposit record as successfully processed
    update public.deposits
    set status = 'success',
        completed_at = now(),
        raw_response = p_raw_response
    where id = v_deposit_id;

    -- 6. Update platform liquidity tracking (singleton row pattern)
    --    liquidity_controls has a uuid PK so ON CONFLICT (col) isn't usable without a unique col.
    --    We use an explicit IF: update the first row if it exists, otherwise insert one.
    select count(*) into v_liquidity_rows from public.liquidity_controls;

    if v_liquidity_rows > 0 then
        update public.liquidity_controls
        set total_platform_deposits = total_platform_deposits + p_amount,
            updated_at = now()
        where id = (select id from public.liquidity_controls limit 1);
    else
        insert into public.liquidity_controls (total_platform_deposits, total_platform_withdrawals)
        values (p_amount, 0.00);
    end if;

    -- 7. Notify the user of the successful credit
    insert into public.notifications (user_id, title, message)
    values (
        p_user_id,
        'Deposit Credited!',
        'Your wallet has been credited with ₦' || to_char(p_amount, 'FM999,999,999.00') || '.'
    );

    return true;
end;
$$ language plpgsql security definer;
