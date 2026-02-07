CREATE SCHEMA IF NOT EXISTS auth;

-- prisma-ignore
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  full_name TEXT;
  first_name TEXT;
  last_name TEXT;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);

  IF full_name IS NOT NULL THEN
    first_name := split_part(full_name, ' ', 1);
    last_name := NULLIF(trim(substr(full_name, length(first_name) + 1)), '');
  END IF;

  UPDATE public."User"
  SET
    "authUserId" = NEW.id,
    "email" = NEW.email,
    "firstName" = COALESCE(first_name, "firstName"),
    "lastName" = COALESCE(last_name, "lastName"),
    "emailVerified" = NEW.email_confirmed_at,
    "image" = NEW.raw_user_meta_data->>'avatar_url',
    "updatedAt" = NOW()
  WHERE "authUserId" = NEW.id
     OR ("email" IS NOT NULL AND "email" = NEW.email);

  IF NOT FOUND THEN
    INSERT INTO public."User" (
      "id",
      "authUserId",
      "email",
      "firstName",
      "lastName",
      "emailVerified",
      "image",
      "role",
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      NEW.id,
      NEW.email,
      first_name,
      last_name,
      NEW.email_confirmed_at,
      NEW.raw_user_meta_data->>'avatar_url',
      CASE LOWER(COALESCE(NEW.app_metadata->>'role', NEW.raw_user_meta_data->>'role'))
        WHEN 'admin' THEN 'ADMIN'
        WHEN 'tech' THEN 'ADMIN'
        WHEN 'moderator' THEN 'MODERATOR'
        WHEN 'service' THEN 'SERVICE'
        ELSE 'USER'
      END,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- prisma-ignore
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth'
      AND table_name = 'users'
  ) THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
  END IF;
END $$;

