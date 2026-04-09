import type { SupabaseUser } from "@repo/frameworks/supabase";

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
  info?: string;
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

export type TripResourceConfig = {
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
};

export type TripInsuranceStepConfig = {
  stepNumber: number;
  title: string;
  text: string;
  requiredInfo?: string[];
  exampleCall?: string;
  additionalText?: string;
};

export type TripInsuranceConfig = {
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
};

export type TripInfoConfig = {
  resources: TripResourceConfig[];
  insurance?: TripInsuranceConfig;
};

export type AuthUserByEmail = Map<string, SupabaseUser>;
