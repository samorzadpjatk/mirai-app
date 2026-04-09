import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Validation rules for TripInsurance data
 */
const VALIDATION_RULES = {
  label: {
    minLength: 1,
    maxLength: 100,
  },
  providerName: {
    minLength: 1,
    maxLength: 100,
  },
  policyNumber: {
    minLength: 1,
    maxLength: 100,
  },
  contractNumber: {
    minLength: 1,
    maxLength: 100,
  },
  phoneNumber: {
    minLength: 1,
    maxLength: 50,
  },
  phoneDisplay: {
    minLength: 1,
    maxLength: 50,
  },
  hospitalName: {
    maxLength: 200,
  },
  hospitalAddress: {
    maxLength: 500,
  },
  hospitalDistance: {
    maxLength: 100,
  },
};

/**
 * TripInsurance entity - represents emergency insurance information for a trip
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class TripInsurance {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly label: string,
    public readonly phoneNumber: string,
    public readonly phoneDisplay: string,
    public readonly policyNumber: string,
    public readonly contractNumber: string,
    public readonly providerName: string,
    public readonly hospitalName: string | null,
    public readonly hospitalAddress: string | null,
    public readonly hospitalDistance: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new TripInsurance
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId: string;
    label: string;
    phoneNumber: string;
    phoneDisplay: string;
    policyNumber: string;
    contractNumber: string;
    providerName: string;
    hospitalName?: string | null;
    hospitalAddress?: string | null;
    hospitalDistance?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<TripInsurance, string> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate label
    if (!props.label || props.label.trim() === "") {
      return err("label is required");
    }
    if (props.label.length > VALIDATION_RULES.label.maxLength) {
      return err(
        `label must be at most ${VALIDATION_RULES.label.maxLength} characters`,
      );
    }

    // Validate phoneNumber
    if (!props.phoneNumber || props.phoneNumber.trim() === "") {
      return err("phoneNumber is required");
    }
    if (props.phoneNumber.length > VALIDATION_RULES.phoneNumber.maxLength) {
      return err(
        `phoneNumber must be at most ${VALIDATION_RULES.phoneNumber.maxLength} characters`,
      );
    }

    // Validate phoneDisplay
    if (!props.phoneDisplay || props.phoneDisplay.trim() === "") {
      return err("phoneDisplay is required");
    }
    if (props.phoneDisplay.length > VALIDATION_RULES.phoneDisplay.maxLength) {
      return err(
        `phoneDisplay must be at most ${VALIDATION_RULES.phoneDisplay.maxLength} characters`,
      );
    }

    // Validate policyNumber
    if (!props.policyNumber || props.policyNumber.trim() === "") {
      return err("policyNumber is required");
    }
    if (props.policyNumber.length > VALIDATION_RULES.policyNumber.maxLength) {
      return err(
        `policyNumber must be at most ${VALIDATION_RULES.policyNumber.maxLength} characters`,
      );
    }

    // Validate contractNumber
    if (!props.contractNumber || props.contractNumber.trim() === "") {
      return err("contractNumber is required");
    }
    if (
      props.contractNumber.length > VALIDATION_RULES.contractNumber.maxLength
    ) {
      return err(
        `contractNumber must be at most ${VALIDATION_RULES.contractNumber.maxLength} characters`,
      );
    }

    // Validate providerName
    if (!props.providerName || props.providerName.trim() === "") {
      return err("providerName is required");
    }
    if (props.providerName.length > VALIDATION_RULES.providerName.maxLength) {
      return err(
        `providerName must be at most ${VALIDATION_RULES.providerName.maxLength} characters`,
      );
    }

    // Validate optional hospital fields
    if (
      props.hospitalName &&
      props.hospitalName.length > VALIDATION_RULES.hospitalName.maxLength
    ) {
      return err(
        `hospitalName must be at most ${VALIDATION_RULES.hospitalName.maxLength} characters`,
      );
    }
    if (
      props.hospitalAddress &&
      props.hospitalAddress.length > VALIDATION_RULES.hospitalAddress.maxLength
    ) {
      return err(
        `hospitalAddress must be at most ${VALIDATION_RULES.hospitalAddress.maxLength} characters`,
      );
    }
    if (
      props.hospitalDistance &&
      props.hospitalDistance.length >
        VALIDATION_RULES.hospitalDistance.maxLength
    ) {
      return err(
        `hospitalDistance must be at most ${VALIDATION_RULES.hospitalDistance.maxLength} characters`,
      );
    }

    const now = new Date();

    return ok(
      new TripInsurance(
        props.id ?? crypto.randomUUID(),
        props.tripId.trim(),
        props.label.trim(),
        props.phoneNumber.trim(),
        props.phoneDisplay.trim(),
        props.policyNumber.trim(),
        props.contractNumber.trim(),
        props.providerName.trim(),
        props.hospitalName ?? null,
        props.hospitalAddress ?? null,
        props.hospitalDistance ?? null,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Update insurance details
   * Returns a new TripInsurance instance (immutable)
   */
  updateDetails(props: {
    label?: string;
    phoneNumber?: string;
    phoneDisplay?: string;
    policyNumber?: string;
    contractNumber?: string;
    providerName?: string;
  }): Result<TripInsurance, string> {
    // Validate label if provided
    if (props.label !== undefined) {
      if (props.label.trim() === "") {
        return err("label is required");
      }
      if (props.label.length > VALIDATION_RULES.label.maxLength) {
        return err(
          `label must be at most ${VALIDATION_RULES.label.maxLength} characters`,
        );
      }
    }

    // Validate phoneNumber if provided
    if (props.phoneNumber !== undefined) {
      if (props.phoneNumber.trim() === "") {
        return err("phoneNumber is required");
      }
      if (props.phoneNumber.length > VALIDATION_RULES.phoneNumber.maxLength) {
        return err(
          `phoneNumber must be at most ${VALIDATION_RULES.phoneNumber.maxLength} characters`,
        );
      }
    }

    // Validate phoneDisplay if provided
    if (props.phoneDisplay !== undefined) {
      if (props.phoneDisplay.trim() === "") {
        return err("phoneDisplay is required");
      }
      if (props.phoneDisplay.length > VALIDATION_RULES.phoneDisplay.maxLength) {
        return err(
          `phoneDisplay must be at most ${VALIDATION_RULES.phoneDisplay.maxLength} characters`,
        );
      }
    }

    // Validate policyNumber if provided
    if (props.policyNumber !== undefined) {
      if (props.policyNumber.trim() === "") {
        return err("policyNumber is required");
      }
      if (props.policyNumber.length > VALIDATION_RULES.policyNumber.maxLength) {
        return err(
          `policyNumber must be at most ${VALIDATION_RULES.policyNumber.maxLength} characters`,
        );
      }
    }

    // Validate contractNumber if provided
    if (props.contractNumber !== undefined) {
      if (props.contractNumber.trim() === "") {
        return err("contractNumber is required");
      }
      if (
        props.contractNumber.length > VALIDATION_RULES.contractNumber.maxLength
      ) {
        return err(
          `contractNumber must be at most ${VALIDATION_RULES.contractNumber.maxLength} characters`,
        );
      }
    }

    // Validate providerName if provided
    if (props.providerName !== undefined) {
      if (props.providerName.trim() === "") {
        return err("providerName is required");
      }
      if (props.providerName.length > VALIDATION_RULES.providerName.maxLength) {
        return err(
          `providerName must be at most ${VALIDATION_RULES.providerName.maxLength} characters`,
        );
      }
    }

    return ok(
      new TripInsurance(
        this.id,
        this.tripId,
        props.label ?? this.label,
        props.phoneNumber ?? this.phoneNumber,
        props.phoneDisplay ?? this.phoneDisplay,
        props.policyNumber ?? this.policyNumber,
        props.contractNumber ?? this.contractNumber,
        props.providerName ?? this.providerName,
        this.hospitalName,
        this.hospitalAddress,
        this.hospitalDistance,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update hospital information
   * Returns a new TripInsurance instance (immutable)
   */
  updateHospitalInfo(props: {
    hospitalName?: string | null;
    hospitalAddress?: string | null;
    hospitalDistance?: string | null;
  }): Result<TripInsurance, string> {
    // Validate hospitalName if provided
    if (props.hospitalName !== undefined && props.hospitalName !== null) {
      if (props.hospitalName.length > VALIDATION_RULES.hospitalName.maxLength) {
        return err(
          `hospitalName must be at most ${VALIDATION_RULES.hospitalName.maxLength} characters`,
        );
      }
    }

    // Validate hospitalAddress if provided
    if (props.hospitalAddress !== undefined && props.hospitalAddress !== null) {
      if (
        props.hospitalAddress.length >
        VALIDATION_RULES.hospitalAddress.maxLength
      ) {
        return err(
          `hospitalAddress must be at most ${VALIDATION_RULES.hospitalAddress.maxLength} characters`,
        );
      }
    }

    return ok(
      new TripInsurance(
        this.id,
        this.tripId,
        this.label,
        this.phoneNumber,
        this.phoneDisplay,
        this.policyNumber,
        this.contractNumber,
        this.providerName,
        props.hospitalName !== undefined
          ? props.hospitalName
          : this.hospitalName,
        props.hospitalAddress !== undefined
          ? props.hospitalAddress
          : this.hospitalAddress,
        props.hospitalDistance !== undefined
          ? props.hospitalDistance
          : this.hospitalDistance,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Check if hospital information is available
   */
  hasHospitalInfo(): boolean {
    return (
      this.hospitalName !== null ||
      this.hospitalAddress !== null ||
      this.hospitalDistance !== null
    );
  }

  /**
   * Get formatted emergency contact information
   */
  getEmergencyContact(): string {
    return `${this.label}: ${this.phoneDisplay} (${this.providerName})`;
  }
}
