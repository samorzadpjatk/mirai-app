import { useSupabaseClient } from "@mirai-app/frameworks/supabase/react";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";

export const useSupabase = (): SupabaseClient => {
  return useSupabaseClient();
};
