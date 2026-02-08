DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    PERFORM cron.schedule(
        'cron_process-notification-schedules',
        '* * * * *',
        $cron$SELECT sp_process_notification_schedules();$cron$
    );
  END IF;
END;
$$;