import type { SupabaseClient } from "@mirai-app/supabase";
import { useSupabaseClient } from "@mirai-app/supabase/react";

export const useSupabase = (): SupabaseClient => {
  return useSupabaseClient();
};
