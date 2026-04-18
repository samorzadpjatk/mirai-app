import { Context } from "effect";
import type { ITripPort } from "@mirai-app/domain";

/**
 * Trip Port - Context.Tag for Effect DI
 */
export class TripPortTag extends Context.Tag("TripPort")<
  TripPortTag,
  ITripPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ITripPort };

/**
 * Trip Resource interface (local definition for backward compatibility)
 */
export interface TripResource {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  iconName: string | null;
  content: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance Step interface (local definition for backward compatibility)
 */
export interface InsuranceStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
}

/**
 * Trip Insurance interface (local definition for backward compatibility)
 */
export interface TripInsurance {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  provider: string | null;
  policyNumber: string | null;
  steps: InsuranceStep[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @deprecated Use TripPortTag instead. Kept for backward compatibility.
 */
export const TripPort = TripPortTag;

/**
 * @deprecated Use ITripPort instead. Kept for backward compatibility.
 */
export type TripPort = typeof TripPortTag;
