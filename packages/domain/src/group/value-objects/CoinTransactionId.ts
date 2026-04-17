import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// CoinTransaction uses UUID
export const CoinTransactionId = createBrandedId("CoinTransactionId", {
  validate: isValidCUID,
});
export type CoinTransactionId = BrandedId<"CoinTransactionId">;
