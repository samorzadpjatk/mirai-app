CREATE INDEX "idx_NotificationSchedule_active_time" ON "NotificationSchedule" ("isActive", "hour", "minute") WHERE "isActive" = true;

CREATE OR REPLACE FUNCTION sp_process_notification_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  schedule_record RECORD;
BEGIN
  FOR schedule_record IN
    SELECT * FROM public."NotificationSchedule"
    WHERE "isActive" = true
      AND CURRENT_TIMESTAMP >= "startDate"
      AND CURRENT_TIMESTAMP <= "endDate"
      AND EXTRACT(HOUR FROM CURRENT_TIMESTAMP) = "hour"
      AND EXTRACT(MINUTE FROM CURRENT_TIMESTAMP) = "minute"
      AND (
        "lastRun" IS NULL 
        OR "lastRun" < DATE_TRUNC('minute', CURRENT_TIMESTAMP)
      )
  LOOP
    INSERT INTO public."Notification" (
      "id",
      "title",
      "body",
      "url",
      "createdById",
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      schedule_record."name",
      'Scheduled notification: ' || schedule_record."notificationType",
      '',
      schedule_record."createdById",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

    UPDATE public."NotificationSchedule"
    SET "lastRun" = CURRENT_TIMESTAMP
    WHERE "id" = schedule_record."id";
  END LOOP;
END;
$$;