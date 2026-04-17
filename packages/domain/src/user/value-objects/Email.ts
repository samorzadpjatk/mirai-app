import {
  createBrandedId,
  type BrandedId,
} from "../../shared/value-objects/branded-id";

// Email value object using branded type
export const Email = {
  create(value: string): BrandedId<"Email"> {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      throw new Error(`Invalid email format: ${value}`);
    }
    return trimmed as BrandedId<"Email">;
  },

  unsafeCreate(value: string): BrandedId<"Email"> {
    return value.trim().toLowerCase() as BrandedId<"Email">;
  },

  normalize(value: string): string {
    return value.trim().toLowerCase();
  },

  isValid(value: string): boolean {
    const trimmed = value.trim().toLowerCase();
    return trimmed.includes("@") && trimmed.includes(".");
  },

  toString(email: BrandedId<"Email">): string {
    return email as string;
  },
};

export type Email = BrandedId<"Email">;
