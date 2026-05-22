import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { trips, type DB } from "@mirai-app/db";

export const createTrip = async (
  context: {
    db: DB;
  },
  input: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    backgroundImagePath?: string;
  },
) => {
  const [trip] = await context.db
    .insert(trips)
    .values({
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      backgroundImagePath: input.backgroundImagePath,
    })
    .returning();
  return trip;
};

export const updateTrip = async (
  context: {
    db: DB;
  },
  input: {
    id: string;
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    backgroundImagePath?: string;
  },
) => {
  const { id, ...data } = input;
  const trip = await context.db.query.trips.findFirst({
    where: (t, { eq }) => eq(t.id, id),
  });
  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }
  const [updated] = await context.db
    .update(trips)
    .set(data)
    .where(eq(trips.id, id))
    .returning();
  return updated;
};

export const deleteTrip = async (
  context: {
    db: DB;
  },
  input: {
    id: string;
  },
) => {
  const [deleted] = await context.db.delete(trips).where(eq(trips.id, input.id)).returning();
  return deleted;
};
