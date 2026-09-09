-- =============================================================================
-- Add `public.notifications` to the Supabase Realtime publication
-- =============================================================================
-- Context: apps/notification-sender listens for INSERTs on the notifications
-- table over Supabase Realtime. Realtime only forwards rows for tables that are
-- members of the `supabase_realtime` publication; the table was never added, so
-- the worker received no events even once it stopped listening on the dropped
-- legacy `"Notification"` table.
--
-- Written defensively so it is a no-op on databases that do not run Realtime
-- (plain Postgres, CI) and idempotent on those that already have the table.
-- Statement-Breakpoint separators are omitted on purpose: this is a single
-- DO block.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
    END IF;
  END IF;
END
$$;
