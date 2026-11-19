DO $$
BEGIN
    IF to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION 'Required table public.users does not exist';
    END IF;
    IF to_regclass('public.claims') IS NULL THEN
        RAISE EXCEPTION 'Required table public.claims does not exist';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'claims' AND column_name = 'claim_amount'
    ) OR NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'claims' AND column_name = 'user_id'
    ) THEN
        RAISE EXCEPTION 'Claims table is missing required persistence columns';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_claims_user_id')
       OR NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_claims_status') THEN
        RAISE EXCEPTION 'Claims lookup indexes are missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_claims_user_id' AND conrelid = 'public.claims'::regclass
    ) THEN
        RAISE EXCEPTION 'Claims-to-users foreign key is missing';
    END IF;

    IF EXISTS (
        SELECT 1 FROM claims
        WHERE claim_amount <= 0
           OR claim_amount > 1000000
           OR incident_date > CURRENT_DATE
           OR char_length(btrim(incident_location)) < 5
           OR char_length(incident_location) > 200
           OR char_length(btrim(description)) < 10
           OR char_length(description) > 1000
           OR status NOT IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED')
    ) THEN
        RAISE EXCEPTION 'Persisted claim violates supported date, text, amount, or status rules';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM claims c
        LEFT JOIN users u ON u.user_id = c.user_id
        WHERE u.user_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Orphaned claims exist without a corresponding user';
    END IF;

    IF EXISTS (
        SELECT 1 FROM users
        GROUP BY email
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate user emails exist';
    END IF;
END;
$$;

SELECT
    (SELECT count(*) FROM users) AS user_count,
    (SELECT count(*) FROM claims) AS claim_count;
