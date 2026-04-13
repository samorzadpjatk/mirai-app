import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError } from "../errors/effect-errors";

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
   *
   * Returns Effect<TripInsurance, ValidationError, never>
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
  }): Effect.Effect<TripInsurance, ValidationError, never> {
    // Validate tripId
    const tripId = validate.id(props.tripId, "tripId");
    if (isError(tripId)) {
      return Effect.fail(
        new ValidationError({
          message: tripId.error.message,
          field: "tripId",
        }),
      );
    }

    // Validate label
    const label = validate.string(props.label, "label", {
      required: true,
      maxLength: 100,
      trim: true,
    });
    if (isError(label)) {
      return Effect.fail(
        new ValidationError({
          message: label.error.message,
          field: "label",
        }),
      );
    }

    // Validate phoneNumber
    const phoneNumber = validate.string(props.phoneNumber, "phoneNumber", {
      required: true,
      maxLength: 50,
      trim: true,
    });
    if (isError(phoneNumber)) {
      return Effect.fail(
        new ValidationError({
          message: phoneNumber.error.message,
          field: "phoneNumber",
        }),
      );
    }

    // Validate phoneDisplay
    const phoneDisplay = validate.string(props.phoneDisplay, "phoneDisplay", {
      required: true,
      maxLength: 50,
      trim: true,
    });
    if (isError(phoneDisplay)) {
      return Effect.fail(
        new ValidationError({
          message: phoneDisplay.error.message,
          field: "phoneDisplay",
        }),
      );
    }

    // Validate policyNumber
    const policyNumber = validate.string(props.policyNumber, "policyNumber", {
      required: true,
      maxLength: 100,
      trim: true,
    });
    if (isError(policyNumber)) {
      return Effect.fail(
        new ValidationError({
          message: policyNumber.error.message,
          field: "policyNumber",
        }),
      );
    }

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
    if (isError(contractNumber)) {
      return Effect.fail(
        new ValidationError({
          message: contractNumber.error.message,
          field: "contractNumber",
        }),
      );
    }

    // Validate providerName
    const providerName = validate.string(props.providerName, "providerName", {
      required: true,
      maxLength: 100,
      trim: true,
    });
    if (isError(providerName)) {
      return Effect.fail(
        new ValidationError({
          message: providerName.error.message,
          field: "providerName",
        }),
      );
    }

    // Validate optional hospital fields
    if (props.hospitalName) {
      const validated = validate.string(props.hospitalName, "hospitalName", {
        required: false,
        maxLength: 200,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "hospitalName",
          }),
        );
      }
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
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "hospitalAddress",
          }),
        );
      }
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
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "hospitalDistance",
          }),
        );
      }
    }

    // Validate steps array (max 20 steps)
    const steps = props.steps ?? [];
    if (steps.length > 20) {
      return Effect.fail(
        new ValidationError({
          message: "Maximum 20 steps allowed",
          field: "steps",
        }),
      );
    }

    const ts = timestamps(props);

    return Effect.succeed(
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
   *
   * Returns Effect<TripInsurance, ValidationError, never>
   */
  updateDetails(props: {
    label?: string;
    phoneNumber?: string;
    phoneDisplay?: string;
    policyNumber?: string;
    contractNumber?: string;
    providerName?: string;
  }): Effect.Effect<TripInsurance, ValidationError, never> {
    const updates: Partial<TripInsurance> = {};

    // Validate label if provided
    if (props.label !== undefined) {
      const validated = validate.string(props.label, "label", {
        required: true,
        maxLength: 100,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "label",
          }),
        );
      }
      updates.label = validated.value;
    }

    // Validate phoneNumber if provided
    if (props.phoneNumber !== undefined) {
      const validated = validate.string(props.phoneNumber, "phoneNumber", {
        required: true,
        maxLength: 50,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "phoneNumber",
          }),
        );
      }
      updates.phoneNumber = validated.value;
    }

    // Validate phoneDisplay if provided
    if (props.phoneDisplay !== undefined) {
      const validated = validate.string(props.phoneDisplay, "phoneDisplay", {
        required: true,
        maxLength: 50,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "phoneDisplay",
          }),
        );
      }
      updates.phoneDisplay = validated.value;
    }

    // Validate policyNumber if provided
    if (props.policyNumber !== undefined) {
      const validated = validate.string(props.policyNumber, "policyNumber", {
        required: true,
        maxLength: 100,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "policyNumber",
          }),
        );
      }
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
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "contractNumber",
          }),
        );
      }
      updates.contractNumber = validated.value;
    }

    // Validate providerName if provided
    if (props.providerName !== undefined) {
      const validated = validate.string(props.providerName, "providerName", {
        required: true,
        maxLength: 100,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "providerName",
          }),
        );
      }
      updates.providerName = validated.value;
    }

    return Effect.succeed(updateEntity(this, updates, TripInsurance));
  }

  /**
   * Update hospital information
   * Returns a new TripInsurance instance (immutable)
   *
   * Returns Effect<TripInsurance, ValidationError, never>
   */
  updateHospitalInfo(props: {
    hospitalName?: string | null;
    hospitalAddress?: string | null;
    hospitalDistance?: string | null;
  }): Effect.Effect<TripInsurance, ValidationError, never> {
    const updates: Partial<TripInsurance> = {};

    // Validate hospitalName if provided
    if (props.hospitalName !== undefined && props.hospitalName !== null) {
      const validated = validate.string(props.hospitalName, "hospitalName", {
        required: false,
        maxLength: 200,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "hospitalName",
          }),
        );
      }
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
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "hospitalAddress",
          }),
        );
      }
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
        if (isError(validated)) {
          return Effect.fail(
            new ValidationError({
              message: validated.error.message,
              field: "hospitalDistance",
            }),
          );
        }
      }
      updates.hospitalDistance = props.hospitalDistance;
    }

    return Effect.succeed(updateEntity(this, updates, TripInsurance));
  }

  /**
   * Add a new step to the insurance procedure
   * Returns a new TripInsurance instance (immutable)
   *
   * Returns Effect<TripInsurance, ValidationError, never>
   */
  addStep(
    step: Omit<InsuranceStep, "stepNumber">,
  ): Effect.Effect<TripInsurance, ValidationError, never> {
    if (this.steps.length >= 20) {
      return Effect.fail(
        new ValidationError({
          message: "Maximum 20 steps allowed",
          field: "steps",
        }),
      );
    }

    // Validate step title
    const title = validate.string(step.title, "title", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(title)) {
      return Effect.fail(
        new ValidationError({
          message: title.error.message,
          field: "title",
        }),
      );
    }

    // Validate step text
    const text = validate.string(step.text, "text", {
      required: true,
      maxLength: 2000,
      trim: true,
    });
    if (isError(text)) {
      return Effect.fail(
        new ValidationError({
          message: text.error.message,
          field: "text",
        }),
      );
    }

    const stepNumber = this.steps.length + 1;
    const newStep: InsuranceStep = {
      ...step,
      stepNumber,
      title: title.value,
      text: text.value,
    };

    return Effect.succeed(
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
   *
   * Returns Effect<TripInsurance, ValidationError, never>
   */
  updateStep(
    stepNumber: number,
    updates: Partial<Omit<InsuranceStep, "stepNumber">>,
  ): Effect.Effect<TripInsurance, ValidationError, never> {
    const step = this.steps.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      return Effect.fail(
        new ValidationError({
          message: `Step ${stepNumber} not found`,
          field: "stepNumber",
        }),
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
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "title",
          }),
        );
      }
      finalUpdates.title = validated.value;
    }

    // Validate text if provided
    if (updates.text !== undefined) {
      const validated = validate.string(updates.text, "text", {
        required: true,
        maxLength: 2000,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "text",
          }),
        );
      }
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

    return Effect.succeed(
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
