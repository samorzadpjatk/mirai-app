CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cron_cleanup-job-details',
  '0 2 * * *',
  $$SELECT sp_clean_job_details(7);$$
);