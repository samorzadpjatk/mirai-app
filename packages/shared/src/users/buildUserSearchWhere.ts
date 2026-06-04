import { groups, tripParticipants, users } from "@mirai-app/db";
import { type SQL, and, eq, sql } from "drizzle-orm";

export type UserSearchField =
  | "firstName"
  | "lastName"
  | "email"
  | "groupName"
  | "wristNumber"
  | "houseNumber";

export function buildUserSearchWhere(
  tripId: string,
  field: UserSearchField,
  searchTerm?: string,
): SQL {
  const base = eq(tripParticipants.tripId, tripId);

  if (!searchTerm) {
    return base;
  }

  if (field === "email") {
    return base;
  }

  const pattern = `%${searchTerm}%`;

  if (field === "groupName") {
    return and(base, sql`LOWER(${groups.name}) LIKE LOWER(${pattern})`) ?? base;
  }

  if (field === "firstName") {
    return and(base, sql`LOWER(${users.firstName}) LIKE LOWER(${pattern})`) ?? base;
  }

  if (field === "lastName") {
    return and(base, sql`LOWER(${users.lastName}) LIKE LOWER(${pattern})`) ?? base;
  }

  if (field === "wristNumber") {
    return and(base, sql`LOWER(${tripParticipants.wristNumber}) LIKE LOWER(${pattern})`) ?? base;
  }

  if (field === "houseNumber") {
    return and(base, sql`LOWER(${tripParticipants.houseNumber}) LIKE LOWER(${pattern})`) ?? base;
  }

  return base;
}
