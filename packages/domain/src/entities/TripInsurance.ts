import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError } from "../errors";

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
    return Effect.gen(function* () {
      // Validate tripId
      const tripId = yield* validate.id(props.tripId, "tripId").pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              message: error.message,
              field: "tripId",
            }),
        ),
      );

      // Validate label
      const label = yield* validate
        .string(props.label, "label", {
          required: true,
          maxLength: 100,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "label",
              }),
          ),
        );

      // Validate phoneNumber
      const phoneNumber = yield* validate
        .string(props.phoneNumber, "phoneNumber", {
          required: true,
          maxLength: 50,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "phoneNumber",
              }),
          ),
        );

      // Validate phoneDisplay
      const phoneDisplay = yield* validate
        .string(props.phoneDisplay, "phoneDisplay", {
          required: true,
          maxLength: 50,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "phoneDisplay",
              }),
          ),
        );

      // Validate policyNumber
      const policyNumber = yield* validate
        .string(props.policyNumber, "policyNumber", {
          required: true,
          maxLength: 100,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "policyNumber",
              }),
          ),
        );

      // Validate contractNumber
      const contractNumber = yield* validate
        .string(props.contractNumber, "contractNumber", {
          required: true,
          maxLength: 100,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "contractNumber",
              }),
          ),
        );

      // Validate providerName
      const providerName = yield* validate
        .string(props.providerName, "providerName", {
          required: true,
          maxLength: 100,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "providerName",
              }),
          ),
        );

      // Validate optional hospital fields
      let hospitalName: string | null = props.hospitalName ?? null;
      if (props.hospitalName) {
        hospitalName = yield* validate
          .string(props.hospitalName, "hospitalName", {
            required: false,
            maxLength: 200,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "hospitalName",
                }),
            ),
          );
      }

      let hospitalAddress: string | null = props.hospitalAddress ?? null;
      if (props.hospitalAddress) {
        hospitalAddress = yield* validate
          .string(props.hospitalAddress, "hospitalAddress", {
            required: false,
            maxLength: 500,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "hospitalAddress",
                }),
            ),
          );
      }

      let hospitalDistance: string | null = props.hospitalDistance ?? null;
      if (props.hospitalDistance) {
        hospitalDistance = yield* validate
          .string(props.hospitalDistance, "hospitalDistance", {
            required: false,
            maxLength: 100,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "hospitalDistance",
                }),
            ),
          );
      }

      // Validate steps array (max 20 steps)
      const steps = props.steps ?? [];
      if (steps.length > 20) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Maximum 20 steps allowed",
            field: "steps",
          }),
        );
      }

      const ts = timestamps(props);

      return new TripInsurance(
        props.id ?? crypto.randomUUID(),
        tripId,
        label,
        phoneNumber,
        phoneDisplay,
        policyNumber,
        contractNumber,
        providerName,
        hospitalName,
        hospitalAddress,
        hospitalDistance,
        Object.freeze([...steps]),
        ts.createdAt,
        ts.updatedAt,
      );
    });
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const updates: Partial<TripInsurance> = {};

      // Validate label if provided
      if (props.label !== undefined) {
        updates.label = yield* validate
          .string(props.label, "label", {
            required: true,
            maxLength: 100,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "label",
                }),
            ),
          );
      }

      // Validate phoneNumber if provided
      if (props.phoneNumber !== undefined) {
        updates.phoneNumber = yield* validate
          .string(props.phoneNumber, "phoneNumber", {
            required: true,
            maxLength: 50,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "phoneNumber",
                }),
            ),
          );
      }

      // Validate phoneDisplay if provided
      if (props.phoneDisplay !== undefined) {
        updates.phoneDisplay = yield* validate
          .string(props.phoneDisplay, "phoneDisplay", {
            required: true,
            maxLength: 50,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "phoneDisplay",
                }),
            ),
          );
      }

      // Validate policyNumber if provided
      if (props.policyNumber !== undefined) {
        updates.policyNumber = yield* validate
          .string(props.policyNumber, "policyNumber", {
            required: true,
            maxLength: 100,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "policyNumber",
                }),
            ),
          );
      }

      // Validate contractNumber if provided
      if (props.contractNumber !== undefined) {
        updates.contractNumber = yield* validate
          .string(props.contractNumber, "contractNumber", {
            required: true,
            maxLength: 100,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "contractNumber",
                }),
            ),
          );
      }

      // Validate providerName if provided
      if (props.providerName !== undefined) {
        updates.providerName = yield* validate
          .string(props.providerName, "providerName", {
            required: true,
            maxLength: 100,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "providerName",
                }),
            ),
          );
      }

      return updateEntity(self, updates, TripInsurance);
    });
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const updates: Partial<TripInsurance> = {};

      // Validate hospitalName if provided
      if (props.hospitalName !== undefined && props.hospitalName !== null) {
        updates.hospitalName = yield* validate
          .string(props.hospitalName, "hospitalName", {
            required: false,
            maxLength: 200,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "hospitalName",
                }),
            ),
          );
      } else if (props.hospitalName === null) {
        updates.hospitalName = null;
      }

      // Validate hospitalAddress if provided
      if (
        props.hospitalAddress !== undefined &&
        props.hospitalAddress !== null
      ) {
        updates.hospitalAddress = yield* validate
          .string(props.hospitalAddress, "hospitalAddress", {
            required: false,
            maxLength: 500,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "hospitalAddress",
                }),
            ),
          );
      } else if (props.hospitalAddress === null) {
        updates.hospitalAddress = null;
      }

      if (props.hospitalDistance !== undefined) {
        if (props.hospitalDistance !== null) {
          updates.hospitalDistance = yield* validate
            .string(props.hospitalDistance, "hospitalDistance", {
              required: false,
              maxLength: 100,
            })
            .pipe(
              Effect.mapError(
                (error) =>
                  new ValidationError({
                    message: error.message,
                    field: "hospitalDistance",
                  }),
              ),
            );
        } else {
          updates.hospitalDistance = null;
        }
      }

      return updateEntity(self, updates, TripInsurance);
    });
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      if (self.steps.length >= 20) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Maximum 20 steps allowed",
            field: "steps",
          }),
        );
      }

      // Validate step title
      const title = yield* validate
        .string(step.title, "title", {
          required: true,
          maxLength: 200,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "title",
              }),
          ),
        );

      // Validate step text
      const text = yield* validate
        .string(step.text, "text", {
          required: true,
          maxLength: 2000,
          trim: true,
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new ValidationError({
                message: error.message,
                field: "text",
              }),
          ),
        );

      const stepNumber = self.steps.length + 1;
      const newStep: InsuranceStep = {
        ...step,
        stepNumber,
        title,
        text,
      };

      return updateEntity(
        self,
        { steps: Object.freeze([...self.steps, newStep]) },
        TripInsurance,
      );
    });
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const step = self.steps.find((s) => s.stepNumber === stepNumber);
      if (!step) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Step ${stepNumber} not found`,
            field: "stepNumber",
          }),
        );
      }

      const finalUpdates: Partial<InsuranceStep> = {};

      // Validate title if provided
      if (updates.title !== undefined) {
        finalUpdates.title = yield* validate
          .string(updates.title, "title", {
            required: true,
            maxLength: 200,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "title",
                }),
            ),
          );
      }

      // Validate text if provided
      if (updates.text !== undefined) {
        finalUpdates.text = yield* validate
          .string(updates.text, "text", {
            required: true,
            maxLength: 2000,
            trim: true,
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new ValidationError({
                  message: error.message,
                  field: "text",
                }),
            ),
          );
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

      const newSteps = self.steps.map((s) =>
        s.stepNumber === stepNumber ? { ...s, ...finalUpdates } : s,
      );

      return updateEntity(
        self,
        { steps: Object.freeze(newSteps) },
        TripInsurance,
      );
    });
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
