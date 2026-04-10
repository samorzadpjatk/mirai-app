/**
 * Coin GraphQL Types
 *
 * Pothos type definitions for Coin domain.
 * Maps from CoinController output to GraphQL schema types.
 *
 * ## Types
 *
 * - CoinTransaction: A coin transaction (add or remove)
 * - CoinTransactionResult: Result from add/remove mutations
 *
 * @module Coin/types
 */

import { builder } from "../builder";

// =============================================================================
// Transaction Type
// =============================================================================

/**
 * Data shape returned from coin controller operations
 */
interface CoinTransactionData {
  id: string;
  amount: number;
  reason: string | null;
  groupId: string;
  adminId: string;
  createdAt: Date;
}

/**
 * CoinTransaction type for GraphQL schema
 *
 * Represents a single coin transaction (addition or removal).
 */
export const CoinTransactionType = builder.objectType("CoinTransaction", {
  description: "A coin transaction (add or remove operation)",
  authScopes: { public: true },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the transaction",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Transaction Fields
    // -------------------------------------------------------------------------

    amount: t.exposeInt("amount", {
      description: "Amount of coins (positive for add, negative for remove)",
      nullable: false,
    }),

    reason: t.exposeString("reason", {
      description: "Reason for the transaction",
      nullable: true,
    }),

    groupId: t.exposeID("groupId", {
      description: "ID of the group receiving/losing coins",
      nullable: false,
    }),

    adminId: t.exposeID("adminId", {
      description: "ID of the admin who performed the transaction",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    createdAt: t.field({
      type: "DateTime",
      description: "When the transaction was created",
      nullable: false,
      resolve: (transaction: CoinTransactionData) => transaction.createdAt,
    }),

    // -------------------------------------------------------------------------
    // Computed Fields
    // -------------------------------------------------------------------------

    isAddition: t.boolean({
      description: "Whether this is an addition (true) or removal (false)",
      nullable: false,
      resolve: (transaction: CoinTransactionData) => transaction.amount > 0,
    }),

    absoluteAmount: t.int({
      description: "Absolute value of the coin amount",
      nullable: false,
      resolve: (transaction: CoinTransactionData) =>
        Math.abs(transaction.amount),
    }),
  }),
});

// =============================================================================
// Result Type
// =============================================================================

/**
 * Result type for add/remove coin mutations
 *
 * Contains the created transaction.
 */
export const CoinTransactionResultType = builder.objectType(
  "CoinTransactionResult",
  {
    description: "Result of an add or remove coins operation",
    authScopes: { public: true },
    fields: (t) => ({
      transaction: t.field({
        type: CoinTransactionType,
        description: "The created coin transaction",
        nullable: false,
        resolve: (result: CoinTransactionData) => result,
      }),

      // Convenience fields at result level
      id: t.exposeID("id", {
        description: "Transaction ID (convenience accessor)",
        nullable: false,
      }),

      amount: t.exposeInt("amount", {
        description: "Transaction amount",
        nullable: false,
      }),

      groupId: t.exposeID("groupId", {
        description: "Group ID (convenience accessor)",
        nullable: false,
      }),

      adminId: t.exposeID("adminId", {
        description: "Admin ID (convenience accessor)",
        nullable: false,
      }),

      createdAt: t.field({
        type: "DateTime",
        description: "Transaction timestamp (convenience accessor)",
        nullable: false,
        resolve: (result: CoinTransactionData) => result.createdAt,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for adding coins to a group
 */
export const AddCoinsInput = builder.inputType("AddCoinsInput", {
  description: "Input for adding coins to a group",
  fields: (t) => ({
    tripId: t.id({
      description: "ID of the trip the group belongs to",
      required: true,
    }),

    groupId: t.id({
      description: "ID of the group to add coins to",
      required: true,
    }),

    amount: t.int({
      description: "Amount of coins to add (must be at least 1)",
      required: true,
    }),

    reason: t.string({
      description: "Reason for adding coins (optional)",
      required: false,
    }),
  }),
});

/**
 * Input for removing coins from a group
 */
export const RemoveCoinsInput = builder.inputType("RemoveCoinsInput", {
  description: "Input for removing coins from a group",
  fields: (t) => ({
    tripId: t.id({
      description: "ID of the trip the group belongs to",
      required: true,
    }),

    groupId: t.id({
      description: "ID of the group to remove coins from",
      required: true,
    }),

    amount: t.int({
      description: "Amount of coins to remove (must be at least 1)",
      required: true,
    }),

    reason: t.string({
      description: "Reason for removing coins (optional)",
      required: false,
    }),
  }),
});

// =============================================================================
// Export
// =============================================================================

export default CoinTransactionType;
