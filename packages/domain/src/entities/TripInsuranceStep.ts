import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Validation rules for TripInsuranceStep data
 */
const VALIDATION_RULES = {
  title: {
    minLength: 1,
    maxLength: 200,
  },
  text: {
    minLength: 1,
    maxLength: 2000,
  },
  exampleCall: {
    maxLength: 1000,
  },
  additionalText: {
    maxLength: 1000,
  },
  requiredInfo: {
    maxItems: 20,
    itemMaxLength: 100,
  },
};

/**
 * TripInsuranceStep entity - represents a single step in emergency procedure
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class TripInsuranceStep {
  private constructor(
    public readonly id: string,
    public readonly insuranceId: string,
    public readonly stepNumber: number,
    public readonly title: string,
    public readonly text: string,
    public readonly requiredInfo: readonly string[],
    public readonly exampleCall: string | null,
    public readonly additionalText: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new TripInsuranceStep
   * Validates all input data
   */
  static create(props: {
    id?: string;
    insuranceId: string;
    stepNumber: number;
    title: string;
    text: string;
    requiredInfo?: string[];
    exampleCall?: string | null;
    additionalText?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<TripInsuranceStep, string> {
    // Validate insuranceId
    if (!props.insuranceId || props.insuranceId.trim() === "") {
      return err("insuranceId is required");
    }

    // Validate stepNumber
    if (props.stepNumber < 1) {
      return err("stepNumber must be at least 1");
    }

    // Validate title
    if (!props.title || props.title.trim() === "") {
      return err("title is required");
    }
    if (props.title.length > VALIDATION_RULES.title.maxLength) {
      return err(
        `title must be at most ${VALIDATION_RULES.title.maxLength} characters`,
      );
    }

    // Validate text
    if (!props.text || props.text.trim() === "") {
      return err("text is required");
    }
    if (props.text.length > VALIDATION_RULES.text.maxLength) {
      return err(
        `text must be at most ${VALIDATION_RULES.text.maxLength} characters`,
      );
    }

    // Validate requiredInfo array
    const requiredInfo = props.requiredInfo ?? [];
    if (requiredInfo.length > VALIDATION_RULES.requiredInfo.maxItems) {
      return err(
        `requiredInfo can have at most ${VALIDATION_RULES.requiredInfo.maxItems} items`,
      );
    }
    for (const info of requiredInfo) {
      if (info.length > VALIDATION_RULES.requiredInfo.itemMaxLength) {
        return err(
          `Each requiredInfo item must be at most ${VALIDATION_RULES.requiredInfo.itemMaxLength} characters`,
        );
      }
    }

    // Validate exampleCall if provided
    if (
      props.exampleCall &&
      props.exampleCall.length > VALIDATION_RULES.exampleCall.maxLength
    ) {
      return err(
        `exampleCall must be at most ${VALIDATION_RULES.exampleCall.maxLength} characters`,
      );
    }

    // Validate additionalText if provided
    if (
      props.additionalText &&
      props.additionalText.length > VALIDATION_RULES.additionalText.maxLength
    ) {
      return err(
        `additionalText must be at most ${VALIDATION_RULES.additionalText.maxLength} characters`,
      );
    }

    const now = new Date();

    return ok(
      new TripInsuranceStep(
        props.id ?? crypto.randomUUID(),
        props.insuranceId.trim(),
        props.stepNumber,
        props.title.trim(),
        props.text.trim(),
        Object.freeze([...requiredInfo]),
        props.exampleCall ?? null,
        props.additionalText ?? null,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Update step content
   * Returns a new TripInsuranceStep instance (immutable)
   */
  updateContent(props: {
    title?: string;
    text?: string;
    exampleCall?: string | null;
    additionalText?: string | null;
  }): Result<TripInsuranceStep, string> {
    // Validate title if provided
    if (props.title !== undefined) {
      if (props.title.trim() === "") {
        return err("title is required");
      }
      if (props.title.length > VALIDATION_RULES.title.maxLength) {
        return err(
          `title must be at most ${VALIDATION_RULES.title.maxLength} characters`,
        );
      }
    }

    // Validate text if provided
    if (props.text !== undefined) {
      if (props.text.trim() === "") {
        return err("text is required");
      }
      if (props.text.length > VALIDATION_RULES.text.maxLength) {
        return err(
          `text must be at most ${VALIDATION_RULES.text.maxLength} characters`,
        );
      }
    }

    // Validate exampleCall if provided
    if (props.exampleCall !== undefined && props.exampleCall !== null) {
      if (props.exampleCall.length > VALIDATION_RULES.exampleCall.maxLength) {
        return err(
          `exampleCall must be at most ${VALIDATION_RULES.exampleCall.maxLength} characters`,
        );
      }
    }

    return ok(
      new TripInsuranceStep(
        this.id,
        this.insuranceId,
        this.stepNumber,
        props.title ?? this.title,
        props.text ?? this.text,
        this.requiredInfo,
        props.exampleCall !== undefined ? props.exampleCall : this.exampleCall,
        props.additionalText !== undefined
          ? props.additionalText
          : this.additionalText,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update required information list
   * Returns a new TripInsuranceStep instance (immutable)
   */
  updateRequiredInfo(
    newRequiredInfo: string[],
  ): Result<TripInsuranceStep, string> {
    if (newRequiredInfo.length > VALIDATION_RULES.requiredInfo.maxItems) {
      return err(
        `requiredInfo can have at most ${VALIDATION_RULES.requiredInfo.maxItems} items`,
      );
    }
    for (const info of newRequiredInfo) {
      if (info.length > VALIDATION_RULES.requiredInfo.itemMaxLength) {
        return err(
          `Each requiredInfo item must be at most ${VALIDATION_RULES.requiredInfo.itemMaxLength} characters`,
        );
      }
    }

    return ok(
      new TripInsuranceStep(
        this.id,
        this.insuranceId,
        this.stepNumber,
        this.title,
        this.text,
        Object.freeze([...newRequiredInfo]),
        this.exampleCall,
        this.additionalText,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Check if step has an example call script
   */
  hasExampleCall(): boolean {
    return this.exampleCall !== null && this.exampleCall.length > 0;
  }

  /**
   * Check if step has additional text
   */
  hasAdditionalText(): boolean {
    return this.additionalText !== null && this.additionalText.length > 0;
  }

  /**
   * Check if step requires specific information
   */
  hasRequiredInfo(): boolean {
    return this.requiredInfo.length > 0;
  }

  /**
   * Get number of required info items
   */
  getRequiredInfoCount(): number {
    return this.requiredInfo.length;
  }
}
