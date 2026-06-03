import type { DB } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";

export const ensureTripParticipant = async (
  context: { db: DB; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, tripId)),
  });
  if (!participant) {
    throw new ORPCError("FORBIDDEN", { message: "Brak dostepu do wyjazdu" });
  }
  return participant;
};
