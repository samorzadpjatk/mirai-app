CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  first_name text;
  last_name text;
  role_value "Role";
BEGIN
  first_name := NEW.raw_user_meta_data->>'firstName';
  last_name := NEW.raw_user_meta_data->>'lastName';
  role_value := CASE lower(COALESCE(NEW.raw_app_meta_data->>'role', 'user'))
    WHEN 'admin' THEN 'ADMIN'
    WHEN 'moderator' THEN 'MODERATOR'
    WHEN 'service' THEN 'SERVICE'
    ELSE 'USER'
  END;

  IF first_name IS NULL OR first_name = '' OR last_name IS NULL OR last_name = '' OR role_value IS NULL THEN
    RAISE EXCEPTION 'Missing required user metadata: firstName, lastName, or role';
  END IF;

  INSERT INTO public."User" ("id", "authUserId", "firstName", "lastName", "role", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    first_name,
    last_name,
    role_value,
    now(),
    now()
  )
  ON CONFLICT ("authUserId") DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  DELETE FROM public."User" WHERE "authUserId" = OLD.id::text;
  RETURN OLD;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth')
     AND EXISTS (
       SELECT 1
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'auth' AND c.relname = 'users'
     )
  THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      BEFORE INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

    DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
    CREATE TRIGGER on_auth_user_deleted
      AFTER DELETE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted();
  END IF;
END;
$$;
