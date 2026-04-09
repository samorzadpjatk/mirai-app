import { useSupabaseClient } from "@repo/frameworks/supabase/react";
import type { SupabaseClient } from "@repo/frameworks/supabase";

export const useSupabase = (): SupabaseClient => {
  return useSupabaseClient();
};
