import { useSupabaseClient } from "@mirai-app/supabase/react";
import type { SupabaseClient } from "@mirai-app/supabase";

export const useSupabase = (): SupabaseClient => {
  return useSupabaseClient();
};
