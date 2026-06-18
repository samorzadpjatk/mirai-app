import { createORPCRouter, moderatorProcedure } from "../../orpc";
import { addCoins, removeCoins } from "./mutations";
import { coinTransactionInputSchema } from "./types";

const handleAddCoins = async ({
  context,
  input,
}: {
  context: Parameters<typeof addCoins>[0];
  input: Parameters<typeof addCoins>[1];
}) => addCoins(context, input);

const handleRemoveCoins = async ({
  context,
  input,
}: {
  context: Parameters<typeof removeCoins>[0];
  input: Parameters<typeof removeCoins>[1];
}) => removeCoins(context, input);

export const coinRouter = createORPCRouter({
  addCoins: moderatorProcedure.input(coinTransactionInputSchema).handler(handleAddCoins),

  removeCoins: moderatorProcedure.input(coinTransactionInputSchema).handler(handleRemoveCoins),
});
