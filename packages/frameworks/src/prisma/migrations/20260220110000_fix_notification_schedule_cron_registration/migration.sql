DO $$
DECLARE
  cron_job RECORD;
  has_pg_cron BOOLEAN := false;
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron extension could not be created: %', SQLERRM;
  END;

  SELECT EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_cron'
  )
  INTO has_pg_cron;

  IF NOT has_pg_cron THEN
    RAISE NOTICE 'pg_cron extension is not available, skipping schedule registration.';
    RETURN;
  END IF;

  FOR cron_job IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'cron_process-notification-schedules'
  LOOP
    PERFORM cron.unschedule(cron_job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'cron_process-notification-schedules',
    '* * * * *',
    $cron$SELECT public.sp_process_notification_schedules();$cron$
  );
END;
$$;
