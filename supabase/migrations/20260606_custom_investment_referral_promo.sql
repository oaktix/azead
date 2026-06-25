-- 1. Drop the old function with the old signature
DROP FUNCTION IF EXISTS public.purchase_investment(uuid, uuid, boolean);

-- 2. Create the updated purchase_investment function accepting amount and duration_years
CREATE OR REPLACE FUNCTION public.purchase_investment(
    p_user_id uuid,
    p_package_id uuid,
    p_amount numeric(20, 2),
    p_duration_years integer,
    p_auto_reinvest boolean
)
RETURNS uuid AS $$
DECLARE
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
BEGIN
    -- 1. Get package name and verify active
    SELECT name INTO v_pkg_name
    FROM public.investment_packages
    WHERE id = p_package_id AND is_active = true;

    IF v_pkg_name IS NULL THEN
        RAISE EXCEPTION 'Investment package not found or inactive';
    END IF;

    -- Strict validations
    IF p_amount < 100000.00 THEN
        RAISE EXCEPTION 'Minimum investment amount is 100,000 NGN';
    END IF;

    IF p_duration_years <= 0 THEN
        RAISE EXCEPTION 'Duration must be at least 1 year';
    END IF;

    v_pkg_interest := 25.00;
    v_pkg_duration := p_duration_years * 365;

    -- 2. Lock user wallet and check balance
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Subscription requires % NGN, but balance is % NGN', p_amount, v_balance;
    END IF;

    -- 3. Deduct from user wallet
    UPDATE public.wallets
    SET balance = balance - p_amount,
        ledger_version = ledger_version + 1,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- 4. Create ledger transaction entry
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, reference, description)
    VALUES (
        v_wallet_id,
        -p_amount,
        'investment_debit',
        'INV-SUB-' || encode(uuid_send(uuid_generate_v4()), 'hex'),
        'Subscribed to: ' || v_pkg_name || ' (' || p_duration_years || ' Year plan)'
    );

    -- 5. Create investment record
    INSERT INTO public.investments (user_id, package_id, amount, interest_rate, status, start_date, maturity_date, auto_reinvest)
    VALUES (
        p_user_id,
        p_package_id,
        p_amount,
        v_pkg_interest,
        'active',
        now(),
        now() + (v_pkg_duration || ' days')::interval,
        p_auto_reinvest
    )
    RETURNING id into v_investment_id;

    -- 6. Referral Commission System: 2.5% on the referee's FIRST successful investment
    SELECT count(*) INTO v_existing_investments_count
    FROM public.investments
    WHERE user_id = p_user_id;

    SELECT referred_by INTO v_referrer_id
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_existing_investments_count = 1 AND v_referrer_id IS NOT NULL THEN
        v_referral_reward_amount := p_amount * 0.025; -- 2.5% of investment amount

        SELECT id INTO v_referral_wallet_id
        FROM public.wallets
        WHERE user_id = v_referrer_id
        FOR UPDATE;

        IF v_referral_wallet_id IS NOT NULL THEN
            UPDATE public.wallets
            SET balance = balance + v_referral_reward_amount,
                ledger_version = ledger_version + 1,
                updated_at = now()
            WHERE id = v_referral_wallet_id;

            INSERT INTO public.wallet_transactions (wallet_id, amount, type, reference, description)
            VALUES (
                v_referral_wallet_id,
                v_referral_reward_amount,
                'referral_bonus',
                'REF-BON-' || encode(uuid_send(uuid_generate_v4()), 'hex'),
                'Referral bonus from first investment of referee'
            );

            INSERT INTO public.referral_rewards (referrer_id, referee_id, investment_id, reward_amount, status)
            VALUES (
                v_referrer_id,
                p_user_id,
                v_investment_id,
                v_referral_reward_amount,
                'paid'
            );

            INSERT INTO public.notifications (user_id, title, message)
            VALUES (
                v_referrer_id,
                'Referral Reward Paid!',
                'You have received ' || v_referral_reward_amount || ' NGN referral bonus for referring a user who subscribed to a package.'
            );
        END IF;
    END IF;

    -- 7. Promo Referral Bonus check:
    -- "anyone who brings in 2 people who invest up to 20 million naira each will get a 1 million bonus as extra"
    IF v_referrer_id IS NOT NULL AND p_amount >= 20000000.00 THEN
        -- Count distinct referees who have at least one active/completed investment of >= 20M
        SELECT count(distinct r.referee_id) INTO v_eligible_referees_count
        from public.referrals r
        join public.investments i on r.referee_id = i.user_id
        where r.referrer_id = v_referrer_id and i.amount >= 20000000.00;

        IF v_eligible_referees_count >= 2 THEN
            -- Check if already paid this referrer the extra bonus
            SELECT exists (
                SELECT 1 FROM public.wallet_transactions
                WHERE wallet_id = (SELECT id FROM public.wallets WHERE user_id = v_referrer_id)
                  AND reference = 'REF-EXTRA-20M'
            ) INTO v_already_paid;

            IF NOT v_already_paid THEN
                SELECT id INTO v_referral_wallet_id
                FROM public.wallets
                WHERE user_id = v_referrer_id
                FOR UPDATE;

                IF v_referral_wallet_id IS NOT NULL THEN
                    UPDATE public.wallets
                    SET balance = balance + 1000000.00,
                        ledger_version = ledger_version + 1,
                        updated_at = now()
                    WHERE id = v_referral_wallet_id;

                    INSERT INTO public.wallet_transactions (wallet_id, amount, type, reference, description)
                    VALUES (
                        v_referral_wallet_id,
                        1000000.00,
                        'referral_bonus',
                        'REF-EXTRA-20M',
                        'Extra 1M NGN bonus for referring 2 investors with at least 20M NGN each.'
                    );

                    -- Log in referral rewards
                    INSERT INTO public.referral_rewards (referrer_id, referee_id, investment_id, reward_amount, status)
                    VALUES (
                        v_referrer_id,
                        p_user_id,
                        v_investment_id,
                        1000000.00,
                        'paid'
                    );

                    INSERT INTO public.notifications (user_id, title, message)
                    VALUES (
                        v_referrer_id,
                        'Extra Referral Promo Paid!',
                        'Congratulations! You have received an extra 1,000,000 NGN referral bonus for referring two investors with at least 20,000,000 NGN each.'
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    -- Send notification to subscriber
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (
        p_user_id,
        'Investment Subscribed!',
        'You have successfully subscribed to the ' || v_pkg_name || ' for ' || p_amount || ' NGN.'
    );

    RETURN v_investment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Replace process_matured_investments function with scaled duration support
CREATE OR REPLACE FUNCTION public.process_matured_investments()
RETURNS integer AS $$
DECLARE
    v_rec record;
    v_wallet_id uuid;
    v_accrued_payout numeric(20, 2);
    v_processed_count integer := 0;
BEGIN
    FOR v_rec IN 
        SELECT i.id, i.user_id, i.amount, i.interest_rate, i.package_id, i.auto_reinvest, i.start_date, i.maturity_date, ip.name as package_name
        FROM public.investments i
        JOIN public.investment_packages ip ON i.package_id = ip.id
        WHERE i.status = 'active' AND i.maturity_date <= now()
    LOOP
        -- Calculate payout amount (principal + 25% interest rate per year scaled by duration)
        DECLARE
            v_duration_days numeric := extract(day from (v_rec.maturity_date - v_rec.start_date));
            v_years numeric := coalesce(nullif(v_duration_days, 0) / 365.0, 1.0);
            v_interest_amount numeric(20, 2) := v_rec.amount * (v_rec.interest_rate / 100) * v_years;
        BEGIN
            v_accrued_payout := v_rec.amount + v_interest_amount;

            -- Lock user wallet
            SELECT id INTO v_wallet_id
            FROM public.wallets
            WHERE user_id = v_rec.user_id
            FOR UPDATE;

            IF v_wallet_id IS NOT NULL THEN
                IF v_rec.auto_reinvest THEN
                    -- Pay out ONLY interest, and reinvest principal automatically
                    UPDATE public.wallets
                    SET balance = balance + v_interest_amount,
                        ledger_version = ledger_version + 1,
                        updated_at = now()
                    WHERE id = v_wallet_id;

                    INSERT INTO public.wallet_transactions (wallet_id, amount, type, reference, description)
                    VALUES (
                        v_wallet_id,
                        v_interest_amount,
                        'investment_payout',
                        'INV-INT-' || encode(uuid_send(v_rec.id), 'hex'),
                        'Accrued interest payout for package: ' || v_rec.package_name
                    );

                    -- Reset investment start/maturity dates to roll it over by original duration interval
                    UPDATE public.investments
                    SET start_date = now(),
                        maturity_date = now() + (v_rec.maturity_date - v_rec.start_date),
                        last_accrual_date = now(),
                        accrued_interest = 0.00
                    WHERE id = v_rec.id;

                    INSERT INTO public.notifications (user_id, title, message)
                    VALUES (
                        v_rec.user_id,
                        'Investment Auto-Reinvested!',
                        'Your ' || v_rec.package_name || ' investment matured. Your interest of ' || v_interest_amount || ' NGN has been paid, and your capital of ' || v_rec.amount || ' NGN has been rolled over.'
                    );
                ELSE
                    -- Pay out both capital and interest
                    UPDATE public.wallets
                    SET balance = balance + v_accrued_payout,
                        ledger_version = ledger_version + 1,
                        updated_at = now()
                    WHERE id = v_wallet_id;

                    INSERT INTO public.wallet_transactions (wallet_id, amount, type, reference, description)
                    VALUES (
                        v_wallet_id,
                        v_accrued_payout,
                        'investment_payout',
                        'INV-PAY-' || encode(uuid_send(v_rec.id), 'hex'),
                        'Full maturity payout (capital + interest) for package: ' || v_rec.package_name
                    );

                    -- Mark investment as completed
                    UPDATE public.investments
                    SET status = 'completed',
                        accrued_interest = v_interest_amount,
                        last_accrual_date = now()
                    WHERE id = v_rec.id;

                    INSERT INTO public.notifications (user_id, title, message)
                    VALUES (
                        v_rec.user_id,
                        'Investment Matured!',
                        'Your ' || v_rec.package_name || ' investment has matured. ' || v_accrued_payout || ' NGN has been paid into your wallet.'
                    );
                END IF;

                v_processed_count := v_processed_count + 1;
            END IF;
        END;
    END LOOP;

    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Clean up investment packages
-- Update Standard package to Azead Wealth Plan (default min 1,000,000 NGN)
UPDATE public.investment_packages
SET name = 'Azead Wealth Plan',
    amount = 1000000.00,
    annual_interest_rate = 25.00,
    duration_days = 365,
    is_active = true
WHERE id = 'cb92d8bc-c10b-4611-8583-bdd5a1cd0d68';

-- Ensure Standard exists in case it was missing
INSERT INTO public.investment_packages (id, name, amount, annual_interest_rate, duration_days, is_active)
VALUES ('cb92d8bc-c10b-4611-8583-bdd5a1cd0d68', 'Azead Wealth Plan', 1000000.00, 25.00, 365, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    amount = EXCLUDED.amount,
    annual_interest_rate = EXCLUDED.annual_interest_rate,
    duration_days = EXCLUDED.duration_days,
    is_active = EXCLUDED.is_active;

-- Deactivate other investment packages
UPDATE public.investment_packages
SET is_active = false
WHERE id != 'cb92d8bc-c10b-4611-8583-bdd5a1cd0d68';
