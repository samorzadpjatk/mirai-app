DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    PERFORM cron.schedule(
      'cron_cleanup-job-details',
      '0 2 * * *',
      $cron$SELECT sp_clean_job_details(7);$cron$
    );
  END IF;
END;
$$;