CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cron_process-notification-schedules',
  '* * * * *',
  $$SELECT sp_process_notification_schedules();$$
);