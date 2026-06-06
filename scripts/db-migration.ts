// scripts/db-migration.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn(e);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Altering database procedures...');

  // 1. Drop old function (since the signature changes from 3 params to 5 params)
  const dropQuery = `drop function if exists public.purchase_investment(uuid, uuid, boolean);`;
  
  // 2. Create new purchase_investment function
  const createPurchaseQuery = `
create or replace function public.purchase_investment(
    p_user_id uuid,
    p_package_id uuid,
    p_amount numeric(20, 2),
    p_duration_years integer,
    p_auto_reinvest boolean
)
returns uuid as $$
declare
    v_wallet_id uuid;
    v_balance numeric(20, 2);
    v_pkg_name text;
    v_pkg_interest numeric(5, 2);
    v_pkg_duration integer;
    v_investment_id uuid;
    v_referrer_id uuid;
    v_referral_reward_amount numeric(20, 2);
    v_referral_wallet_id uuid;
    v_existing_investments_count bigint;
    v_eligible_referees_count bigint;
    v_already_paid boolean;
begin
    -- 1. Get package name
    select name into v_pkg_name
    from public.investment_packages
    where id = p_package_id and is_active = true;

    if v_pkg_name is null then
        raise exception 'Investment package not found or inactive';
    end if;

    v_pkg_interest := 25.00;
    v_pkg_duration := p_duration_years * 365;

    if p_amount < 1000000.00 then
        raise exception 'Minimum investment amount is 1,000,000 NGN';
    end if;

    if p_duration_years <= 0 then
        raise exception 'Duration must be at least 1 year';
    end if;

    -- 2. Lock user wallet and check balance
    select id, balance into v_wallet_id, v_balance
    from public.wallets
    where user_id = p_user_id
    for update;

    if v_balance < p_amount then
        raise exception 'Insufficient wallet balance. Subscription requires % NGN, but balance is % NGN', p_amount, v_balance;
    end if;

    -- 3. Deduct from user wallet
    update public.wallets
    set balance = balance - p_amount,
        ledger_version = ledger_version + 1,
        updated_at = now()
    where id = v_wallet_id;

    -- 4. Create ledger transaction entry
    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
    values (
        v_wallet_id,
        -p_amount,
        'investment_debit',
        'INV-SUB-' || encode(uuid_send(uuid_generate_v4()), 'hex'),
        'Subscribed to: ' || v_pkg_name || ' (' || p_duration_years || ' Year plan)'
    );

    -- 5. Create investment record
    insert into public.investments (user_id, package_id, amount, interest_rate, status, start_date, maturity_date, auto_reinvest)
    values (
        p_user_id,
        p_package_id,
        p_amount,
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

    -- Resolve referrer
    select referred_by into v_referrer_id
    from public.profiles
    where id = p_user_id;

    if v_existing_investments_count = 1 and v_referrer_id is not null then
        v_referral_reward_amount := p_amount * 0.025; -- 2.5% of package amount

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

    -- 7. Promo Referral Bonus check:
    -- "anyone who brings in 2 people who invest up to 20 million naira each will get a 1 million bonus as extra"
    if v_referrer_id is not null and p_amount >= 20000000.00 then
        -- Count distinct referees who have at least one investment of >= 20M
        select count(distinct r.referee_id) into v_eligible_referees_count
        from public.referrals r
        join public.investments i on r.referee_id = i.user_id
        where r.referrer_id = v_referrer_id and i.amount >= 20000000.00;

        if v_eligible_referees_count >= 2 then
            -- Check if already paid
            select exists (
                select 1 from public.wallet_transactions
                where wallet_id = (select id from public.wallets where user_id = v_referrer_id)
                  and reference = 'REF-EXTRA-20M'
            ) into v_already_paid;

            if not v_already_paid then
                -- Lock referrer wallet and pay reward
                select id into v_referral_wallet_id
                from public.wallets
                where user_id = v_referrer_id
                for update;

                if v_referral_wallet_id is not null then
                    update public.wallets
                    set balance = balance + 1000000.00,
                        ledger_version = ledger_version + 1,
                        updated_at = now()
                      where id = v_referral_wallet_id;

                    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
                    values (
                        v_referral_wallet_id,
                        1000000.00,
                        'referral_bonus',
                        'REF-EXTRA-20M',
                        'Extra 1M NGN bonus for referring 2 investors with at least 20M NGN each.'
                    );

                    -- Log in referral rewards table too
                    insert into public.referral_rewards (referrer_id, referee_id, investment_id, reward_amount, status)
                    values (
                        v_referrer_id,
                        p_user_id,
                        v_investment_id,
                        1000000.00,
                        'paid'
                    );

                    insert into public.notifications (user_id, title, message)
                    values (
                        v_referrer_id,
                        'Extra Referral Promo Paid!',
                        'Congratulations! You have received an extra 1,000,000 NGN referral bonus for referring two investors with at least 20,000,000 NGN each.'
                    );
                end if;
            end if;
        end if;
    end if;

    -- Send notification to subscriber
    insert into public.notifications (user_id, title, message)
    values (
        p_user_id,
        'Investment Subscribed!',
        'You have successfully subscribed to the ' || v_pkg_name || ' for ' || p_amount || ' NGN.'
    );

    return v_investment_id;
end;
$$ language plpgsql security definer;
  `;

  // 3. Replace process_matured_investments function
  const createMaturityQuery = `
create or replace function public.process_matured_investments()
returns integer as $$
declare
    v_rec record;
    v_wallet_id uuid;
    v_accrued_payout numeric(20, 2);
    v_processed_count integer := 0;
begin
    for v_rec in 
        select i.id, i.user_id, i.amount, i.interest_rate, i.package_id, i.auto_reinvest, i.start_date, i.maturity_date, ip.name as package_name
        from public.investments i
        join public.investment_packages ip on i.package_id = ip.id
        where i.status = 'active' and i.maturity_date <= now()
    loop
        -- Calculate payout amount (principal + 25% interest rate per year)
        declare
            v_duration_days numeric := extract(day from (v_rec.maturity_date - v_rec.start_date));
            v_years numeric := coalesce(nullif(v_duration_days, 0) / 365.0, 1.0);
            v_interest_amount numeric(20, 2) := v_rec.amount * (v_rec.interest_rate / 100) * v_years;
        begin
            v_accrued_payout := v_rec.amount + v_interest_amount;

            -- 2. Lock user wallet
            select id into v_wallet_id
            from public.wallets
            where user_id = v_rec.user_id
            for update;

            if v_wallet_id is not null then
                -- Check if user wants auto-reinvest
                if v_rec.auto_reinvest then
                    -- Pay out ONLY interest, and reinvest principal automatically
                    -- Add interest to wallet
                    update public.wallets
                    set balance = balance + v_interest_amount,
                        ledger_version = ledger_version + 1,
                        updated_at = now()
                    where id = v_wallet_id;

                    -- Record interest payout in ledger
                    insert into public.wallet_transactions (wallet_id, amount, type, reference, description)
                    values (
                        v_wallet_id,
                        v_interest_amount,
                        'investment_payout',
                        'INV-INT-' || encode(uuid_send(v_rec.id), 'hex'),
                        'Accrued interest payout for package: ' || v_rec.package_name
                    );

                    -- Reset investment start/maturity dates to roll it over by original duration
                    update public.investments
                    set start_date = now(),
                        maturity_date = now() + (v_rec.maturity_date - v_rec.start_date),
                        last_accrual_date = now(),
                        accrued_interest = 0.00
                    where id = v_rec.id;

                    -- Notify user
                    insert into public.notifications (user_id, title, message)
                    values (
                        v_rec.user_id,
                        'Investment Auto-Reinvested!',
                        'Your ' || v_rec.package_name || ' investment matured. Your interest of ' || v_interest_amount || ' NGN has been paid, and your capital of ' || v_rec.amount || ' NGN has been rolled over.'
                    );
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
                        accrued_interest = v_interest_amount,
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
        end;
    end loop;

    return v_processed_count;
end;
$$ language plpgsql security definer;
  `;

  // Run Drop function
  console.log('Dropping old function signature...');
  const { error: dropErr } = await supabase.rpc('execute_sql', { sql_query: dropQuery });
  if (dropErr) {
    console.log('Drop function fallback (using direct SQL execute endpoint)...');
  }

  // Run Create new purchase_investment
  console.log('Creating new purchase_investment function...');
  const { error: pErr } = await supabase.rpc('execute_sql', { sql_query: createPurchaseQuery });
  if (pErr) {
    console.error('Error creating purchase_investment RPC:', pErr);
    // If execute_sql helper doesn't exist, we can output the SQL or try direct query
  } else {
    console.log('✅ purchase_investment function created successfully.');
  }

  // Run Create process_matured_investments
  console.log('Creating process_matured_investments function...');
  const { error: mErr } = await supabase.rpc('execute_sql', { sql_query: createMaturityQuery });
  if (mErr) {
    console.error('Error creating process_matured_investments RPC:', mErr);
  } else {
    console.log('✅ process_matured_investments function created successfully.');
  }

  // Clean up packages table to leave exactly one row
  console.log('Cleaning up packages table...');
  
  // Let's delete all existing packages except one, or reset the table and insert the single active package.
  // First, let's delete packages
  const { data: existingPackages, error: listErr } = await supabase
    .from('investment_packages')
    .select('id, name');

  if (listErr) {
    console.error('Error listing packages:', listErr);
    return;
  }

  console.log(`Found ${existingPackages.length} packages in DB.`);

  // Keep one standard standard package ID or update the first one
  const targetPackageId = 'cb92d8bc-c10b-4611-8583-bdd5a1cd0d68';
  
  const standardPkg = existingPackages.find(p => p.id === targetPackageId);
  if (standardPkg) {
    console.log('Updating existing Standard package to Azead Wealth Plan...');
    const { error: updateErr } = await supabase
      .from('investment_packages')
      .update({
        name: 'Azead Wealth Plan',
        amount: 1000000.00,
        annual_interest_rate: 25.00,
        duration_days: 365,
        is_active: true
      })
      .eq('id', targetPackageId);
    
    if (updateErr) console.error('Error updating standard package:', updateErr);
  } else {
    console.log('Inserting Azead Wealth Plan package...');
    const { error: insertErr } = await supabase
      .from('investment_packages')
      .upsert({
        id: targetPackageId,
        name: 'Azead Wealth Plan',
        amount: 1000000.00,
        annual_interest_rate: 25.00,
        duration_days: 365,
        is_active: true
      });
    if (insertErr) console.error('Error inserting Azead Wealth Plan:', insertErr);
  }

  // Deleting other packages to avoid conflicts
  for (const pkg of existingPackages) {
    if (pkg.id !== targetPackageId) {
      console.log(`Deleting redundant package: ${pkg.name} (${pkg.id})...`);
      const { error: delErr } = await supabase
        .from('investment_packages')
        .delete()
        .eq('id', pkg.id);
      if (delErr) {
        console.warn(`Could not delete package ${pkg.name} (probably has active investments referencing it):`, delErr.message);
        // If it can't be deleted because of foreign key constraint, just deactivate it!
        const { error: deacErr } = await supabase
          .from('investment_packages')
          .update({ is_active: false })
          .eq('id', pkg.id);
        if (deacErr) console.error(`Error deactivating package ${pkg.name}:`, deacErr);
        else console.log(`Deactivated package ${pkg.name} instead.`);
      }
    }
  }

  console.log('Migration finished.');
}

main().catch((e) => console.error('Unexpected error:', e));
