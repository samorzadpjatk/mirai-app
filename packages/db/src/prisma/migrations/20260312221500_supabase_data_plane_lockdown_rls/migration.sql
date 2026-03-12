-- Supabase data-plane lockdown:
-- 1) Enable RLS on all application tables in public schema.
-- 2) Keep full table access available only to internal roles via RLS policy.
-- 3) Revoke table privileges from anon/authenticated.
-- 4) Revoke default privileges for future tables created in public schema.

DO $$
DECLARE
  app_tables text[] := ARRAY[
    'User',
    'Trip',
    'TripResource',
    'TripInsurance',
    'TripInsuranceStep',
    'TripParticipant',
    'Event',
    'UserEvent',
    'Group',
    'GroupJoinRequest',
    'Challenge',
    'ChallengeSubmission',
    'ChallengeVote',
    'SubmissionReport',
    'ActivityFeed',
    'ActivityReaction',
    'SubmissionActivity',
    'ChallengeActivity',
    'RankChangeActivity',
    'UserPost',
    'CoinTransaction',
    'NotificationSchedule',
    'Notification',
    'NotificationScheduleExecution',
    'NotificationPush',
    'NotificationDelivery',
    'PushSubscription',
    'Location',
    'LocationSharingRequest',
    'Reward',
    'RewardPurchase',
    'UserAgent',
    'Sponsor',
    'TripSponsor'
  ];
  table_name text;
  has_anon boolean;
  has_authenticated boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
  INTO has_anon;

  SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
  INTO has_authenticated;

  FOREACH table_name IN ARRAY app_tables LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      table_name
    );

    EXECUTE format(
      'DROP POLICY IF EXISTS "internal_full_access" ON public.%I',
      table_name
    );

    EXECUTE format(
      'CREATE POLICY "internal_full_access" ON public.%I FOR ALL TO PUBLIC USING (
        current_user = ''service_role''
        OR current_user = ''postgres''
        OR current_user = ''pgbouncer''
        OR current_user LIKE ''postgres.%%''
      ) WITH CHECK (
        current_user = ''service_role''
        OR current_user = ''postgres''
        OR current_user = ''pgbouncer''
        OR current_user LIKE ''postgres.%%''
      )',
      table_name
    );

    IF has_anon THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon',
        table_name
      );
    END IF;

    IF has_authenticated THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated',
        table_name
      );
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    IF has_anon THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
    END IF;
    IF has_authenticated THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    IF has_anon THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
    END IF;
    IF has_authenticated THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
    END IF;
  END IF;
END
$$;

-- Verification query (expect 0 rows):
-- SELECT c.relname
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public'
--   AND c.relkind = 'r'
--   AND c.relname = ANY(ARRAY[
--     'User','Trip','TripResource','TripInsurance','TripInsuranceStep','TripParticipant',
--     'Event','UserEvent','Group','GroupJoinRequest','Challenge','ChallengeSubmission',
--     'ChallengeVote','SubmissionReport','ActivityFeed','ActivityReaction',
--     'SubmissionActivity','ChallengeActivity','RankChangeActivity','UserPost',
--     'CoinTransaction','NotificationSchedule','Notification','NotificationScheduleExecution',
--     'NotificationPush','NotificationDelivery','PushSubscription','Location',
--     'LocationSharingRequest','Reward','RewardPurchase','UserAgent','Sponsor','TripSponsor'
--   ])
--   AND c.relrowsecurity = false;
