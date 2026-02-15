import type { SupabaseUser } from "@integral-2025-app/supabase";

export type SeedEnv = "dev" | "prod";

export type TripConfig = {
  key: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  users: string;
  background?: string;
};

export type CsvUser = {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
};

export type AuthUserByEmail = Map<string, SupabaseUser>;
