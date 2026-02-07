-- prisma-ignore
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
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
    "email" = NEW.email,
    "firstName" = COALESCE(first_name, "firstName"),
    "lastName" = COALESCE(last_name, "lastName"),
    "emailVerified" = NEW.email_confirmed_at,
    "image" = NEW.raw_user_meta_data->>'avatar_url',
    "role" = CASE LOWER(COALESCE(NEW.raw_app_meta_data->>'role', NEW.raw_user_meta_data->>'role'))
      WHEN 'admin' THEN 'ADMIN'
      WHEN 'tech' THEN 'ADMIN'
      WHEN 'moderator' THEN 'MODERATOR'
      WHEN 'service' THEN 'SERVICE'
      ELSE "role"
    END,
    "updatedAt" = NOW()
  WHERE "authUserId" = NEW.id;

  RETURN NEW;
END;
$$;

-- prisma-ignore
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, raw_user_meta_data, raw_app_meta_data, email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_updated();
