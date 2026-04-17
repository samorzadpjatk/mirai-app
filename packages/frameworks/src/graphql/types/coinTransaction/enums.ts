import { builder } from "../../builder.js";

/**
 * Create Coin Transaction Input
 */
export const CreateCoinTransactionInput = builder.inputType(
  "CreateCoinTransactionInput",
  {
    description: "Input for creating a coin transaction",
    fields: (t) => ({
      tripId: t.field({ type: "ID", required: true }),
      groupId: t.field({ type: "ID", required: true }),
      amount: t.field({ type: "Int", required: true }),
      reason: t.field({ type: "String" }),
    }),
  },
);

/**
 * Update Coin Transaction Input
 */
export const UpdateCoinTransactionInput = builder.inputType(
  "UpdateCoinTransactionInput",
  {
    description: "Input for updating a coin transaction",
    fields: (t) => ({
      reason: t.field({ type: "String" }),
    }),
  },
);
