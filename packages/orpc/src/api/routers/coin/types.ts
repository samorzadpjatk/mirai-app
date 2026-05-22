import { z } from "zod";

export const coinTransactionInputSchema = z.object({
  tripId: z.string(),
  groupId: z.string(),
  amount: z.number().min(1),
  reason: z.string().optional(),
});

export type CoinTransactionInput = z.infer<typeof coinTransactionInputSchema>;
