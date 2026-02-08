import { useSupabaseClient } from "@integral-2025-app/supabase/react";
import type { SupabaseClient } from "@integral-2025-app/supabase";

export const useSupabase = (): SupabaseClient => {
  return useSupabaseClient();
};
