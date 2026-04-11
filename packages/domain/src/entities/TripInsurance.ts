import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError } from "../errors/domain-errors";

/**
 * Insurance step interface - represents a single step in emergency procedure
 * Replaces TripInsuranceStep entity
 */
export interface InsuranceStep {
  stepNumber: number;
  title: string;
  text: string;
  requiredInfo: readonly string[];
  exampleCall: string | null;
  additionalText: string | null;
}

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
    public label: string,
    public phoneNumber: string,
    public phoneDisplay: string,
    public policyNumber: string,
    public contractNumber: string,
    public providerName: string,
    public hospitalName: string | null,
    public hospitalAddress: string | null,
    public hospitalDistance: string | null,
    // NEW: Nested steps
    public steps: readonly InsuranceStep[],
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
    // NEW: Steps parameter
    steps?: InsuranceStep[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<TripInsurance, ValidationError> {
    // Validate tripId
    const tripId = validate.id(props.tripId, "tripId");
    if (isError(tripId)) return err(tripId.error);

    // Validate label
    const label = validate.string(props.label, "label", {
      required: true,
      maxLength: 100,
      trim: true,
    });
    if (isError(label)) return err(label.error);

    // Validate phoneNumber
    const phoneNumber = validate.string(props.phoneNumber, "phoneNumber", {
      required: true,
      maxLength: 50,
      trim: true,
    });
    if (isError(phoneNumber)) return err(phoneNumber.error);

    // Validate phoneDisplay
    const phoneDisplay = validate.string(props.phoneDisplay, "phoneDisplay", {
      required: true,
      maxLength: 50,
      trim: true,
    });
    if (isError(phoneDisplay)) return err(phoneDisplay.error);

    // Validate policyNumber
    const policyNumber = validate.string(props.policyNumber, "policyNumber", {
      required: true,
      maxLength: 100,
      trim: true,
    });
    if (isError(policyNumber)) return err(policyNumber.error);

    // Validate contractNumber
    const contractNumber = validate.string(
      props.contractNumber,
      "contractNumber",
      {
        required: true,
        maxLength: 100,
        trim: true,
      },
    );
    if (isError(contractNumber)) return err(contractNumber.error);

    // Validate providerName
    const providerName = validate.string(props.providerName, "providerName", {
      required: true,
      maxLength: 100,
      trim: true,
    });
    if (isError(providerName)) return err(providerName.error);

    // Validate optional hospital fields
    if (props.hospitalName) {
      const validated = validate.string(props.hospitalName, "hospitalName", {
        required: false,
        maxLength: 200,
      });
      if (isError(validated)) return err(validated.error);
    }

    if (props.hospitalAddress) {
      const validated = validate.string(
        props.hospitalAddress,
        "hospitalAddress",
        {
          required: false,
          maxLength: 500,
        },
      );
      if (isError(validated)) return err(validated.error);
    }

    if (props.hospitalDistance) {
      const validated = validate.string(
        props.hospitalDistance,
        "hospitalDistance",
        {
          required: false,
          maxLength: 100,
        },
      );
      if (isError(validated)) return err(validated.error);
    }

    // Validate steps array (max 20 steps)
    const steps = props.steps ?? [];
    if (steps.length > 20) {
      return err(new ValidationError("Maximum 20 steps allowed", "steps"));
    }

    const ts = timestamps(props);

    return ok(
      new TripInsurance(
        props.id ?? crypto.randomUUID(),
        tripId.value,
        label.value,
        phoneNumber.value,
        phoneDisplay.value,
        policyNumber.value,
        contractNumber.value,
        providerName.value,
        props.hospitalName ?? null,
        props.hospitalAddress ?? null,
        props.hospitalDistance ?? null,
        Object.freeze([...steps]),
        ts.createdAt,
        ts.updatedAt,
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
  }): Result<TripInsurance, ValidationError> {
    const updates: Partial<TripInsurance> = {};

    // Validate label if provided
    if (props.label !== undefined) {
      const validated = validate.string(props.label, "label", {
        required: true,
        maxLength: 100,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.label = validated.value;
    }

    // Validate phoneNumber if provided
    if (props.phoneNumber !== undefined) {
      const validated = validate.string(props.phoneNumber, "phoneNumber", {
        required: true,
        maxLength: 50,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.phoneNumber = validated.value;
    }

    // Validate phoneDisplay if provided
    if (props.phoneDisplay !== undefined) {
      const validated = validate.string(props.phoneDisplay, "phoneDisplay", {
        required: true,
        maxLength: 50,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.phoneDisplay = validated.value;
    }

    // Validate policyNumber if provided
    if (props.policyNumber !== undefined) {
      const validated = validate.string(props.policyNumber, "policyNumber", {
        required: true,
        maxLength: 100,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.policyNumber = validated.value;
    }

    // Validate contractNumber if provided
    if (props.contractNumber !== undefined) {
      const validated = validate.string(
        props.contractNumber,
        "contractNumber",
        {
          required: true,
          maxLength: 100,
          trim: true,
        },
      );
      if (isError(validated)) return err(validated.error);
      updates.contractNumber = validated.value;
    }

    // Validate providerName if provided
    if (props.providerName !== undefined) {
      const validated = validate.string(props.providerName, "providerName", {
        required: true,
        maxLength: 100,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      updates.providerName = validated.value;
    }

    return ok(updateEntity(this, updates, TripInsurance));
  }

  /**
   * Update hospital information
   * Returns a new TripInsurance instance (immutable)
   */
  updateHospitalInfo(props: {
    hospitalName?: string | null;
    hospitalAddress?: string | null;
    hospitalDistance?: string | null;
  }): Result<TripInsurance, ValidationError> {
    const updates: Partial<TripInsurance> = {};

    // Validate hospitalName if provided
    if (props.hospitalName !== undefined && props.hospitalName !== null) {
      const validated = validate.string(props.hospitalName, "hospitalName", {
        required: false,
        maxLength: 200,
      });
      if (isError(validated)) return err(validated.error);
      updates.hospitalName = validated.value;
    } else if (props.hospitalName === null) {
      updates.hospitalName = null;
    }

    // Validate hospitalAddress if provided
    if (props.hospitalAddress !== undefined && props.hospitalAddress !== null) {
      const validated = validate.string(
        props.hospitalAddress,
        "hospitalAddress",
        {
          required: false,
          maxLength: 500,
        },
      );
      if (isError(validated)) return err(validated.error);
      updates.hospitalAddress = validated.value;
    } else if (props.hospitalAddress === null) {
      updates.hospitalAddress = null;
    }

    if (props.hospitalDistance !== undefined) {
      if (props.hospitalDistance !== null) {
        const validated = validate.string(
          props.hospitalDistance,
          "hospitalDistance",
          {
            required: false,
            maxLength: 100,
          },
        );
        if (isError(validated)) return err(validated.error);
      }
      updates.hospitalDistance = props.hospitalDistance;
    }

    return ok(updateEntity(this, updates, TripInsurance));
  }

  /**
   * Add a new step to the insurance procedure
   * Returns a new TripInsurance instance (immutable)
   */
  addStep(
    step: Omit<InsuranceStep, "stepNumber">,
  ): Result<TripInsurance, ValidationError> {
    if (this.steps.length >= 20) {
      return err(new ValidationError("Maximum 20 steps allowed", "steps"));
    }

    // Validate step title
    const title = validate.string(step.title, "title", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(title)) return err(title.error);

    // Validate step text
    const text = validate.string(step.text, "text", {
      required: true,
      maxLength: 2000,
      trim: true,
    });
    if (isError(text)) return err(text.error);

    const stepNumber = this.steps.length + 1;
    const newStep: InsuranceStep = {
      ...step,
      stepNumber,
      title: title.value,
      text: text.value,
    };

    return ok(
      updateEntity(
        this,
        { steps: Object.freeze([...this.steps, newStep]) },
        TripInsurance,
      ),
    );
  }

  /**
   * Remove a step by step number
   * Returns a new TripInsurance instance with renumbered steps (immutable)
   */
  removeStep(stepNumber: number): TripInsurance {
    const newSteps = this.steps
      .filter((s) => s.stepNumber !== stepNumber)
      .map((s, index) => ({ ...s, stepNumber: index + 1 })); // Renumber remaining

    return updateEntity(
      this,
      { steps: Object.freeze(newSteps) },
      TripInsurance,
    );
  }

  /**
   * Update an existing step
   * Returns a new TripInsurance instance (immutable)
   */
  updateStep(
    stepNumber: number,
    updates: Partial<Omit<InsuranceStep, "stepNumber">>,
  ): Result<TripInsurance, ValidationError> {
    const step = this.steps.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      return err(
        new ValidationError(`Step ${stepNumber} not found`, "stepNumber"),
      );
    }

    const finalUpdates: Partial<InsuranceStep> = {};

    // Validate title if provided
    if (updates.title !== undefined) {
      const validated = validate.string(updates.title, "title", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      finalUpdates.title = validated.value;
    }

    // Validate text if provided
    if (updates.text !== undefined) {
      const validated = validate.string(updates.text, "text", {
        required: true,
        maxLength: 2000,
        trim: true,
      });
      if (isError(validated)) return err(validated.error);
      finalUpdates.text = validated.value;
    }

    if (updates.requiredInfo !== undefined) {
      finalUpdates.requiredInfo = updates.requiredInfo;
    }
    if (updates.exampleCall !== undefined) {
      finalUpdates.exampleCall = updates.exampleCall;
    }
    if (updates.additionalText !== undefined) {
      finalUpdates.additionalText = updates.additionalText;
    }

    const newSteps = this.steps.map((s) =>
      s.stepNumber === stepNumber ? { ...s, ...finalUpdates } : s,
    );

    return ok(
      updateEntity(this, { steps: Object.freeze(newSteps) }, TripInsurance),
    );
  }

  /**
   * Get step count
   */
  getStepCount(): number {
    return this.steps.length;
  }

  /**
   * Check if has any steps
   */
  hasSteps(): boolean {
    return this.steps.length > 0;
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
