import type { SupabaseUser } from "@mirai-app/supabase";

export type SeedEnv = "dev" | "prod";

export interface TripConfig {
  key: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  users: string;
  background?: string;
  rewards?: string;
  sponsors?: string;
  info?: string;
  /** Per-trip visual theme key (e.g. "PIRATE"); defaults to "DEFAULT". */
  theme?: string;
}

export interface CsvUser {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface RewardConfig {
  name: string;
  description: string;
  availableQuantity: number;
  coinCost: number;
  image?: string;
}

export interface SponsorConfig {
  id: string;
  name: string;
  description: string;
  logoPath: string;
  height?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface TripResourceConfig {
  type: string;
  label: string;
  description?: string;
  url?: string;
  storagePath?: string;
  fileName?: string;
  publicUrl?: string;
  iconName?: string;
  value?: string;
  sortOrder?: number;
}

interface TripInsuranceStepConfig {
  stepNumber: number;
  title: string;
  text: string;
  requiredInfo?: string[];
  exampleCall?: string;
  additionalText?: string;
}

interface TripInsuranceConfig {
  label: string;
  phoneNumber: string;
  phoneDisplay: string;
  policyNumber: string;
  contractNumber: string;
  providerName: string;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalDistance?: string;
  steps: TripInsuranceStepConfig[];
}

export interface TripInfoConfig {
  resources: TripResourceConfig[];
  insurance?: TripInsuranceConfig;
}

export type AuthUserByEmail = Map<string, SupabaseUser>;
