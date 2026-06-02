import { eq, and, SQL, sql } from "drizzle-orm";
import { users, tripParticipants, groups } from "@mirai-app/db";

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
