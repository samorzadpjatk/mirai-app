import { builder, CoinTransactionTypeEnum } from "../../builder.js";

export const CoinTransactionType = builder.objectType("CoinTransaction", {
  description: "Coin transaction record",
  fields: (t) => ({
    id: t.exposeID("id"),
    groupId: t.exposeID("groupId"),
    amount: t.exposeInt("amount"),
    reason: t.exposeString("reason", { nullable: true }),
    adminId: t.exposeID("adminId", { nullable: true }),
    createdAt: t.field({ type: "DateTime", resolve: (tx) => tx.createdAt }),
  }),
});

export const CoinBalanceType = builder.objectType("CoinBalance", {
  description: "Coin balance for a group",
  fields: (t) => ({
    groupId: t.exposeID("groupId"),
    name: t.exposeString("name"),
    coins: t.exposeInt("coins"),
    totalEarned: t.exposeInt("totalEarned"),
    totalSpent: t.exposeInt("totalSpent"),
  }),
});

// Relay connection types for coin transactions
export const CoinTransactionConnectionType = builder.connectionObject(
  { name: "CoinTransactionConnection", type: CoinTransactionType },
  { name: "CoinTransactionEdge" }
);

import "./queries.js";
