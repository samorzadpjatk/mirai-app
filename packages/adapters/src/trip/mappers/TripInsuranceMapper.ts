import type {
  TripInsuranceSelect,
  TripInsuranceStepSelect,
} from "@mirai-app/frameworks/drizzle";

/**
 * Insurance Step interface (from TripPort)
 */
interface InsuranceStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
}

/**
 * TripInsurance DTO interface (from TripPort)
 */
interface TripInsurance {
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
 * TripInsurance Mapper
 *
 * Maps between database TripInsurance records and TripInsurance DTOs.
 */
export class TripInsuranceMapper {
  /**
   * Convert database step record to InsuranceStep DTO
   */
  toStepDTO(dbStep: TripInsuranceStepSelect): InsuranceStep {
    return {
      id: dbStep.id,
      stepNumber: dbStep.stepNumber,
      title: dbStep.title,
      description: dbStep.description ?? null,
    };
  }

  /**
   * Convert multiple database step records to InsuranceStep DTOs
   */
  toStepDTOs(dbSteps: TripInsuranceStepSelect[]): InsuranceStep[] {
    return dbSteps
      .map((s) => this.toStepDTO(s))
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  /**
   * Convert database insurance record and steps to TripInsurance DTO
   */
  toDTO(
    dbInsurance: TripInsuranceSelect,
    dbSteps: TripInsuranceStepSelect[],
  ): TripInsurance {
    return {
      id: dbInsurance.id,
      tripId: dbInsurance.tripId,
      title: dbInsurance.title,
      description: dbInsurance.description ?? null,
      provider: dbInsurance.provider ?? null,
      policyNumber: dbInsurance.policyNumber ?? null,
      steps: this.toStepDTOs(dbSteps),
      createdAt: dbInsurance.createdAt,
      updatedAt: dbInsurance.updatedAt,
    };
  }
}

export const tripInsuranceMapper = new TripInsuranceMapper();
