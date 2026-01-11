ALTER TABLE "NotificationSchedule" ADD COLUMN "notificationTitle" TEXT,
ADD COLUMN "notificationBody" TEXT;

CREATE OR REPLACE FUNCTION sp_process_notification_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  schedule_record RECORD;
  new_notification_id TEXT;
  notification_title TEXT;
  notification_body TEXT;
  notification_url TEXT;
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
    IF schedule_record."notificationType" = 'custom' THEN
      notification_title := COALESCE(schedule_record."notificationTitle", schedule_record."name");
      notification_body := COALESCE(schedule_record."notificationBody", 'Custom scheduled notification');
      notification_url := '';
    ELSIF schedule_record."notificationType" = 'ranking' THEN
      notification_title := 'Daily Ranking Update';
      notification_body := 'Check out today''s rankings!';
      notification_url := '/ranking';
    ELSE
      notification_title := schedule_record."name";
      notification_body := 'Scheduled notification: ' || schedule_record."notificationType";
      notification_url := '';
    END IF;

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
      notification_title,
      notification_body,
      notification_url,
      schedule_record."createdById",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ) RETURNING "id" INTO new_notification_id;

    UPDATE public."NotificationSchedule"
    SET "lastRun" = CURRENT_TIMESTAMP
    WHERE "id" = schedule_record."id";
  END LOOP;
END;
$$;
