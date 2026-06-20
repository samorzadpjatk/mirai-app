import { validateUserRegistration } from "@mirai-app/common/users";
import { tripParticipants, users } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, count, eq } from "drizzle-orm";
import type { z } from "zod";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import type { UserContext } from "./queries";
import { roleSchema, userWithAuthSelect } from "./types";
import { formatUserFullName, toPublicUser } from "./utils";

export const updateAvatar = async (context: UserContext, input: { hasAvatar: boolean }) => {
  const [updatedUser] = await context.db
    .update(users)
    .set({
      hasAvatar: input.hasAvatar,
    })
    .where(eq(users.id, context.dbUser.id))
    .returning({
      hasAvatar: users.hasAvatar,
    });

  return updatedUser;
};

export const updateMyProfile = async (
  context: UserContext,
  input: { firstName: string; lastName: string },
) => {
  const [updatedUser] = await context.db
    .update(users)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
    })
    .where(eq(users.id, context.dbUser.id))
    .returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
    });

  return updatedUser;
};

export const updateUserAdminStatus = async (
  context: UserContext,
  input: { userId: string; role: z.infer<typeof roleSchema> },
) => {
  if (input.userId === context.dbUser.id && input.role !== roleSchema.enum.ADMIN) {
    throw new ORPCError("FORBIDDEN", {
      message: "Nie możesz usunąć swoich uprawnień administratora",
    });
  }

  const [updatedUser] = await context.db
    .update(users)
    .set({
      role: input.role,
    })
    .where(eq(users.id, input.userId))
    .returning({
      id: users.id,
      authUserId: users.authUserId,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    });

  if (!updatedUser) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update user" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [updatedUser.authUserId]);

  return toPublicUser(updatedUser, emailByAuthUserId);
};

export const createUser = async (
  context: UserContext,
  input: { tripId: string; firstName: string; lastName: string; email: string },
) => {
  const { firstName, lastName, email } = validateUserRegistration(input);

  const { data, error } = await context.supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { firstName, lastName },
    app_metadata: { role: roleSchema.enum.USER },
  });

  if (error || !data?.user) {
    throw new ORPCError("BAD_REQUEST", {
      message: error?.message ?? "Failed to create auth user",
    });
  }

  const authUserId = data.user.id;

  const result = await context.db.transaction(async (tx) => {
    const existingUser = await tx.query.users.findFirst({
      where: (u, { eq }) => eq(u.authUserId, authUserId),
      columns: userWithAuthSelect,
    });

    let dbUser = existingUser;
    if (!dbUser) {
      const [inserted] = await tx
        .insert(users)
        .values({
          authUserId,
          firstName,
          lastName,
          role: roleSchema.enum.USER,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          id: users.id,
          authUserId: users.authUserId,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        });
      if (!inserted) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create user" });
      }
      dbUser = inserted;
    }

    await tx
      .insert(tripParticipants)
      .values({
        userId: dbUser.id,
        tripId: input.tripId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [tripParticipants.userId, tripParticipants.tripId],
      })
      .returning();

    const participant = await tx.query.tripParticipants.findFirst({
      where: (tp, { eq, and }) => and(eq(tp.userId, dbUser.id), eq(tp.tripId, input.tripId)),
      with: {
        user: {
          columns: userWithAuthSelect,
        },
        group: { columns: { id: true, name: true } },
      },
      columns: {
        wristNumber: true,
        houseNumber: true,
        tripId: true,
      },
    });

    if (!participant) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create or update participant",
      });
    }

    return { participant, dbUser };
  });

  const emailByAuthUserId = new Map([[authUserId, data.user.email ?? email]]);

  return {
    ...toPublicUser(result.participant.user, emailByAuthUserId),
    wristNumber: result.participant.wristNumber,
    houseNumber: result.participant.houseNumber,
    group: result.participant.group,
    tripId: result.participant.tripId,
  };
};

export const updateName = async (
  context: UserContext,
  input: { userId: string; firstName: string; lastName: string },
) => {
  const [updatedUser] = await context.db
    .update(users)
    .set({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
    })
    .where(eq(users.id, input.userId))
    .returning({
      id: users.id,
      authUserId: users.authUserId,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    });

  if (!updatedUser) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update user" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [updatedUser.authUserId]);

  return toPublicUser(updatedUser, emailByAuthUserId);
};

export const banUserUntil = async (
  context: UserContext,
  input: { userId: string; bannedUntilMs: number; reason?: string },
) => {
  const user = await context.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, input.userId),
    columns: { authUserId: true },
  });

  if (!user) {
    throw new ORPCError("NOT_FOUND", { message: "User not found" });
  }

  const bannedUntil = new Date(input.bannedUntilMs);

  if (Number.isNaN(bannedUntil.getTime())) {
    throw new ORPCError("BAD_REQUEST", { message: "Invalid ban date" });
  }

  const diffMs = bannedUntil.getTime() - Date.now();
  if (diffMs <= 0) {
    throw new ORPCError("BAD_REQUEST", { message: "Ban date must be in the future" });
  }

  const diffMinutes = Math.ceil(diffMs / 60000);
  const banDuration = `${diffMinutes}m`;

  const adminUser = await context.supabase.auth.admin.getUserById(user.authUserId);

  if (adminUser.error || !adminUser.data.user) {
    throw new ORPCError("BAD_REQUEST", {
      message: adminUser.error?.message ?? "Failed to fetch auth user",
    });
  }

  const existingMetadata =
    (adminUser.data.user as { app_metadata?: { ban_reason?: string | null } } | null)
      ?.app_metadata ?? {};
  const reason = input.reason?.trim();
  const nextMetadata = {
    ...existingMetadata,
    ban_reason: reason && reason.length > 0 ? reason : null,
  };

  const { error } = await context.supabase.auth.admin.updateUserById(user.authUserId, {
    ban_duration: banDuration,
    app_metadata: nextMetadata,
  });

  if (error) {
    throw new ORPCError("BAD_REQUEST", { message: error.message });
  }

  return { bannedUntil: bannedUntil.toISOString() };
};

export const deleteUser = async (
  context: UserContext,
  input: { userId: string; tripId: string },
) => {
  const user = await context.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, input.userId),
    columns: { id: true, authUserId: true },
  });

  if (!user) {
    throw new ORPCError("NOT_FOUND", { message: "User not found" });
  }

  const result = await context.db.transaction(async (tx) => {
    const participant = await tx.query.tripParticipants.findFirst({
      where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
      columns: { id: true },
    });

    if (!participant) {
      throw new ORPCError("NOT_FOUND", { message: "User is not assigned to this trip" });
    }

    await tx
      .delete(tripParticipants)
      .where(
        and(eq(tripParticipants.userId, input.userId), eq(tripParticipants.tripId, input.tripId)),
      );

    const [remainingResult] = await tx
      .select({ count: count() })
      .from(tripParticipants)
      .where(eq(tripParticipants.userId, input.userId));
    const remainingTrips = remainingResult?.count ?? 0;

    if (remainingTrips === 0) {
      await tx.delete(users).where(eq(users.id, input.userId));
    }

    return { remainingTrips };
  });

  if (result.remainingTrips === 0) {
    const { error } = await context.supabase.auth.admin.deleteUser(user.authUserId);
    if (error) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
  }

  return { deletedFromSystem: result.remainingTrips === 0 };
};

export const updateWristNumber = async (
  context: UserContext,
  input: { userId: string; tripId: string; wristNumber: string },
) => {
  const existingParticipant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and, ne }) =>
      and(
        eq(tp.tripId, input.tripId),
        eq(tp.wristNumber, input.wristNumber),
        ne(tp.userId, input.userId),
      ),
    with: {
      user: {
        columns: userWithAuthSelect,
      },
    },
    columns: { userId: true },
  });

  if (existingParticipant) {
    const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
      existingParticipant.user.authUserId,
    ]);
    throw new ORPCError("CONFLICT", {
      message: `Numer opaski ${input.wristNumber} jest już przypisany do użytkownika: ${formatUserFullName(
        toPublicUser(existingParticipant.user, emailByAuthUserId),
      )}`,
    });
  }

  await context.db
    .insert(tripParticipants)
    .values({
      userId: input.userId,
      tripId: input.tripId,
      wristNumber: input.wristNumber,
    })
    .onConflictDoUpdate({
      target: [tripParticipants.userId, tripParticipants.tripId],
      set: { wristNumber: input.wristNumber },
    })
    .returning();

  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
    with: {
      user: {
        columns: userWithAuthSelect,
      },
    },
    columns: {
      wristNumber: true,
      tripId: true,
    },
  });

  if (!participant) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update wrist number" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    participant.user.authUserId,
  ]);

  return {
    ...participant,
    user: toPublicUser(participant.user, emailByAuthUserId),
  };
};

export const removeWristNumber = async (
  context: UserContext,
  input: { userId: string; tripId: string },
) => {
  await context.db
    .update(tripParticipants)
    .set({
      wristNumber: null,
    })
    .where(
      and(eq(tripParticipants.userId, input.userId), eq(tripParticipants.tripId, input.tripId)),
    )
    .returning();

  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
    with: {
      user: {
        columns: userWithAuthSelect,
      },
    },
    columns: {
      wristNumber: true,
      tripId: true,
    },
  });

  if (!participant) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to remove wrist number" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    participant.user.authUserId,
  ]);

  return {
    ...participant,
    user: toPublicUser(participant.user, emailByAuthUserId),
  };
};

export const updateHouseNumber = async (
  context: UserContext,
  input: { userId: string; tripId: string; houseNumber: string },
) => {
  await context.db
    .insert(tripParticipants)
    .values({
      userId: input.userId,
      tripId: input.tripId,
      houseNumber: input.houseNumber,
    })
    .onConflictDoUpdate({
      target: [tripParticipants.userId, tripParticipants.tripId],
      set: { houseNumber: input.houseNumber },
    })
    .returning();

  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
    with: {
      user: {
        columns: userWithAuthSelect,
      },
    },
    columns: {
      houseNumber: true,
      tripId: true,
    },
  });

  if (!participant) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update house number" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    participant.user.authUserId,
  ]);

  return {
    ...participant,
    user: toPublicUser(participant.user, emailByAuthUserId),
  };
};

export const removeHouseNumber = async (
  context: UserContext,
  input: { userId: string; tripId: string },
) => {
  await context.db
    .update(tripParticipants)
    .set({
      houseNumber: null,
    })
    .where(
      and(eq(tripParticipants.userId, input.userId), eq(tripParticipants.tripId, input.tripId)),
    )
    .returning();

  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
    with: {
      user: {
        columns: userWithAuthSelect,
      },
    },
    columns: {
      houseNumber: true,
      tripId: true,
    },
  });

  if (!participant) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to remove house number" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    participant.user.authUserId,
  ]);

  return {
    ...participant,
    user: toPublicUser(participant.user, emailByAuthUserId),
  };
};
