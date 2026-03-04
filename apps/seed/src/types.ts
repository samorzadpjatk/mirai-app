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
  rewards?: string;
  sponsors?: string;
};

export type CsvUser = {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
};

export type RewardConfig = {
  name: string;
  description: string;
  availableQuantity: number;
  coinCost: number;
  image?: string;
};

export type SponsorConfig = {
  id: string;
  name: string;
  description: string;
  logoPath: string;
  height?: number;
  offsetX?: number;
  offsetY?: number;
};

export type AuthUserByEmail = Map<string, SupabaseUser>;
