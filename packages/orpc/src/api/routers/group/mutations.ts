import { coinTransactions, groupJoinRequests, groups, tripParticipants } from "@mirai-app/db";
import {
  buildLeaveResult,
  calculateNextOrganizer,
  canDeleteGroupAsOrganizer,
  canRemoveUserFromGroup,
  canUpdateGroup,
  canViewJoinRequests,
  isUserInGroup,
} from "@mirai-app/shared/groups";
import { ORPCError } from "@orpc/server";
import { and, count, eq, inArray } from "drizzle-orm";
import {
  captureTripRankingSnapshot,
  createRankChangeActivities,
} from "../../../utils/activityFeed";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { ensureTripNotEnded, ensureTripNotEndedByGroupId } from "../../../utils/tripGuards";
import type { OrderByCallback, WhereCallback } from "../utils/drizzle-types";
import type { GroupContext } from "./queries";
import {
  generateFourDigitCode,
  normalizeGroupImageInput,
  resolveGroupImage,
  toUserWithEmail,
} from "./utils";

export const create = async (
  context: GroupContext,
  input: {
    tripId: string;
    name: string;
    description?: string;
    image?: string;
    organizerId?: string;
  },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const group = await (async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const code = generateFourDigitCode();
      try {
        const [groupRow] = await context.db
          .insert(groups)
          .values({
            name: input.name,
            description: input.description ?? "",
            image: normalizeGroupImageInput(input.image),
            code,
            tripId: input.tripId,
            organizerId: input.organizerId ?? context.dbUser.id,
          })
          .returning();

        if (!groupRow) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create group" });
        }

        const matchGroupRowId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, groupRow.id);

        const groupWithOrganizer = await context.db.query.groups.findFirst({
          where: matchGroupRowId,
          with: {
            organizer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                authUserId: true,
              },
            },
          },
        });

        if (!groupWithOrganizer) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to fetch created group",
          });
        }

        return groupWithOrganizer;
      } catch (error: unknown) {
        let dbErrorCode = "";
        if (error instanceof Error && "code" in error) {
          dbErrorCode = (error as { code: string }).code;
        }
        if (dbErrorCode === "P2002") {
          continue;
        }
        throw error;
      }
    }

    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to generate a unique group code",
    });
  })();

  await context.db.transaction(async (tx) => {
    await tx
      .insert(tripParticipants)
      .values({
        userId: context.dbUser.id,
        tripId: input.tripId,
        groupId: group.id,
      })
      .onConflictDoUpdate({
        target: [tripParticipants.userId, tripParticipants.tripId],
        set: { groupId: group.id },
      });

    await tx
      .delete(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.tripId, input.tripId),
          eq(groupJoinRequests.userId, context.dbUser.id),
        ),
      );
  });

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    group.organizer?.authUserId,
  ]);

  return {
    ...group,
    image: await resolveGroupImage(context.supabase, group.image),
    organizer: group.organizer
      ? toUserWithEmail(group.organizer, emailByAuthUserId)
      : group.organizer,
  };
};

export const update = async (
  context: GroupContext,
  input: {
    id: string;
    tripId: string;
    name?: string;
    description?: string;
    image?: string;
    organizerId?: string;
  },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const { id, tripId, ...updateData } = input;
  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, id);

  const group = await context.db.query.groups.findFirst({ where: matchGroupId });
  if (group?.tripId !== tripId || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const updateCheck = canUpdateGroup(
    context.dbUser.role,
    group.organizerId === context.dbUser.id,
    Boolean(updateData.organizerId && updateData.organizerId !== group.organizerId),
  );
  if (updateCheck.error) {
    throw new ORPCError(updateCheck.error, { message: updateCheck.message });
  }

  const isAdmin = context.dbUser.role === "ADMIN";

  await context.db
    .update(groups)
    .set({
      ...updateData,
      organizerId: isAdmin ? updateData.organizerId : undefined,
      image: normalizeGroupImageInput(input.image),
    })
    .where(eq(groups.id, id));

  const updatedGroup = await context.db.query.groups.findFirst({
    where: matchGroupId,
    with: {
      organizer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          authUserId: true,
        },
      },
    },
  });

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    updatedGroup?.organizer?.authUserId,
  ]);

  return {
    ...updatedGroup,
    image: await resolveGroupImage(context.supabase, updatedGroup?.image),
    organizer: updatedGroup?.organizer
      ? toUserWithEmail(updatedGroup.organizer, emailByAuthUserId)
      : updatedGroup?.organizer,
  };
};

export const deleteGroup = async (context: GroupContext, input: { id: string }) => {
  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.id);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    columns: { id: true, isDeleted: true },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  await context.db.transaction(async (tx) => {
    await tx
      .update(tripParticipants)
      .set({ groupId: null })
      .where(eq(tripParticipants.groupId, input.id));

    await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, input.id));

    await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, input.id));
  });

  return { success: true };
};

export const deleteMyGroup = async (context: GroupContext, input: { groupId: string }) => {
  await ensureTripNotEndedByGroupId(context.db, input.groupId);

  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.groupId);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    columns: { id: true, organizerId: true, isDeleted: true, tripId: true },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const deleteCheck = canDeleteGroupAsOrganizer(group.organizerId, context.dbUser.id);
  if (deleteCheck.error) {
    throw new ORPCError(deleteCheck.error, { message: deleteCheck.message });
  }

  await context.db.transaction(async (tx) => {
    await tx
      .update(tripParticipants)
      .set({ groupId: null })
      .where(eq(tripParticipants.groupId, input.groupId));

    await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, input.groupId));

    await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, input.groupId));
  });

  return { success: true };
};

export const join = async (context: GroupContext, input: { id: string; tripId: string }) => {
  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.id);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    with: {
      participants: {
        columns: { id: true, userId: true, tripId: true, groupId: true },
      },
    },
  });
  if (!group) throw new ORPCError("NOT_FOUND", { message: "Group not found" });

  if (group.tripId !== input.tripId || group.isDeleted) {
    throw new ORPCError("BAD_REQUEST", { message: "Group not in trip" });
  }

  if (isUserInGroup(context.dbUser.id, group.participants)) {
    throw new ORPCError("CONFLICT", { message: "Użytkownik już należy do tej grupy" });
  }

  const [participant] = await context.db.transaction(async (tx) => {
    const [upsertedParticipant] = await tx
      .insert(tripParticipants)
      .values({
        userId: context.dbUser.id,
        tripId: input.tripId,
        groupId: input.id,
      })
      .onConflictDoUpdate({
        target: [tripParticipants.userId, tripParticipants.tripId],
        set: { groupId: input.id },
      })
      .returning();

    await tx
      .delete(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.tripId, input.tripId),
          eq(groupJoinRequests.userId, context.dbUser.id),
        ),
      );

    return [upsertedParticipant];
  });

  return participant;
};

export const requestToJoin = async (context: GroupContext, input: { groupId: string }) => {
  await ensureTripNotEndedByGroupId(context.db, input.groupId);

  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.groupId);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    columns: { id: true, tripId: true, organizerId: true, isDeleted: true },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const matchUserAndTrip: WhereCallback<"tripParticipants"> = (tp, { and, eq }) =>
    and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, group.tripId));

  const participant = await context.db.query.tripParticipants.findFirst({
    where: matchUserAndTrip,
    columns: { groupId: true },
  });

  if (!participant) {
    throw new ORPCError("FORBIDDEN", {
      message: "Only trip participants can request joining a group",
    });
  }

  if (participant.groupId) {
    throw new ORPCError("BAD_REQUEST", { message: "You are already in a group" });
  }

  const matchUserTripRequest: WhereCallback<"groupJoinRequests"> = (gjr, { and, eq }) =>
    and(eq(gjr.tripId, group.tripId), eq(gjr.userId, context.dbUser.id));

  const existingRequest = await context.db.query.groupJoinRequests.findFirst({
    where: matchUserTripRequest,
  });

  if (existingRequest) {
    if (existingRequest.groupId === group.id) {
      throw new ORPCError("CONFLICT", {
        message: "Join request for this group is already pending",
      });
    }

    throw new ORPCError("CONFLICT", {
      message: "You already have a pending request for another group",
    });
  }

  const [request] = await context.db
    .insert(groupJoinRequests)
    .values({
      groupId: group.id,
      tripId: group.tripId,
      userId: context.dbUser.id,
    })
    .returning();

  return request;
};

export const cancelMyJoinRequest = async (context: GroupContext, input: { groupId: string }) => {
  await ensureTripNotEndedByGroupId(context.db, input.groupId);

  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.groupId);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    columns: { id: true, tripId: true, isDeleted: true },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const matchGroupTripUser: WhereCallback<"groupJoinRequests"> = (gjr, { and, eq }) =>
    and(eq(gjr.groupId, group.id), eq(gjr.tripId, group.tripId), eq(gjr.userId, context.dbUser.id));

  const existingRequest = await context.db.query.groupJoinRequests.findFirst({
    where: matchGroupTripUser,
    columns: { id: true },
  });

  if (!existingRequest) {
    throw new ORPCError("NOT_FOUND", { message: "Join request not found" });
  }

  await context.db.delete(groupJoinRequests).where(eq(groupJoinRequests.id, existingRequest.id));

  return { success: true };
};

export const respondToJoinRequest = async (
  context: GroupContext,
  input: { requestId: string; decision: "ACCEPT" | "REJECT" },
) => {
  return await context.db.transaction(async (tx) => {
    const matchRequestId: WhereCallback<"groupJoinRequests"> = (gjr, { eq }) =>
      eq(gjr.id, input.requestId);

    const request = await tx.query.groupJoinRequests.findFirst({
      where: matchRequestId,
      with: {
        group: {
          columns: {
            id: true,
            tripId: true,
            organizerId: true,
            isDeleted: true,
          },
        },
      },
    });

    if (!request) {
      throw new ORPCError("NOT_FOUND", { message: "Join request not found" });
    }

    await ensureTripNotEnded(context.db, request.tripId);

    const respondCheck = canViewJoinRequests(request.group.organizerId, context.dbUser.id);
    if (respondCheck.error) {
      throw new ORPCError(respondCheck.error, { message: respondCheck.message });
    }

    if (request.group.isDeleted) {
      throw new ORPCError("NOT_FOUND", { message: "Group not found" });
    }

    if (input.decision === "REJECT") {
      await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.id, request.id));
      return { status: "REJECTED" as const };
    }

    const matchUserTrip: WhereCallback<"tripParticipants"> = (tp, { and, eq }) =>
      and(eq(tp.userId, request.userId), eq(tp.tripId, request.tripId));

    const participant = await tx.query.tripParticipants.findFirst({
      where: matchUserTrip,
      columns: { id: true, groupId: true },
    });

    if (!participant) {
      throw new ORPCError("BAD_REQUEST", { message: "User is not a participant of this trip" });
    }

    if (participant.groupId && participant.groupId !== request.groupId) {
      throw new ORPCError("BAD_REQUEST", { message: "User is already in another group" });
    }

    await tx
      .update(tripParticipants)
      .set({ groupId: request.groupId })
      .where(eq(tripParticipants.id, participant.id));

    await tx
      .delete(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.tripId, request.tripId),
          eq(groupJoinRequests.userId, request.userId),
        ),
      );

    return { status: "ACCEPTED" as const };
  });
};

export const assignUserToGroup = async (
  context: GroupContext,
  input: { userId: string; tripId: string; groupId: string },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.groupId);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    with: {
      participants: true,
    },
  });
  if (!group) throw new ORPCError("NOT_FOUND", { message: "Group not found" });

  if (group.tripId !== input.tripId || group.isDeleted) {
    throw new ORPCError("BAD_REQUEST", { message: "Group not in trip" });
  }

  if (isUserInGroup(input.userId, group.participants)) {
    throw new ORPCError("CONFLICT", { message: "Użytkownik już należy do tej grupy" });
  }

  const [participant] = await context.db.transaction(async (tx) => {
    const [upsertedParticipant] = await tx
      .insert(tripParticipants)
      .values({
        userId: input.userId,
        tripId: input.tripId,
        groupId: input.groupId,
      })
      .onConflictDoUpdate({
        target: [tripParticipants.userId, tripParticipants.tripId],
        set: { groupId: input.groupId },
      })
      .returning();

    await tx
      .delete(groupJoinRequests)
      .where(
        and(eq(groupJoinRequests.tripId, input.tripId), eq(groupJoinRequests.userId, input.userId)),
      );

    return [upsertedParticipant];
  });

  return participant;
};

export const bulkAssignUsersToGroup = async (
  context: GroupContext,
  input: { tripId: string; groupId: string; userIds: string[] },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.groupId);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    columns: { organizerId: true, tripId: true, isDeleted: true },
  });

  if (group?.tripId !== input.tripId || group?.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  if (group?.organizerId !== context.dbUser.id) {
    throw new ORPCError("FORBIDDEN", {
      message: "Only the organizer can assign users to this group",
    });
  }

  const uniqueUserIds = Array.from(new Set(input.userIds));

  await context.db.transaction(async (tx) => {
    await Promise.all(
      uniqueUserIds.map((userId) =>
        tx
          .insert(tripParticipants)
          .values({
            userId,
            tripId: input.tripId,
            groupId: input.groupId,
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: input.groupId },
          }),
      ),
    );
    await tx
      .delete(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.tripId, input.tripId),
          inArray(groupJoinRequests.userId, uniqueUserIds),
        ),
      );
  });

  const matchTripAndUsers: WhereCallback<"tripParticipants"> = (tp, { and, eq, inArray }) =>
    and(eq(tp.tripId, input.tripId), inArray(tp.userId, uniqueUserIds));

  const participants = await context.db.query.tripParticipants.findMany({
    where: matchTripAndUsers,
    with: {
      user: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          authUserId: true,
        },
      },
    },
  });

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    participants.map((participant) => participant.user.authUserId),
  );

  return {
    count: participants.length,
    participants: participants.map((participant) => ({
      ...participant,
      user: toUserWithEmail(participant.user, emailByAuthUserId),
    })),
  };
};

export const removeUserFromGroup = async (
  context: GroupContext,
  input: { userId: string; tripId: string },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  return await context.db.transaction(async (tx) => {
    const matchUserAndTrip: WhereCallback<"tripParticipants"> = (tp, { and, eq }) =>
      and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId));

    const participant = await tx.query.tripParticipants.findFirst({
      where: matchUserAndTrip,
      columns: { id: true, groupId: true, userId: true },
    });

    if (!participant) {
      throw new ORPCError("NOT_FOUND", { message: "Participant not found" });
    }

    const groupId = participant.groupId;
    const group = groupId
      ? await tx.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, groupId),
          columns: {
            id: true,
            tripId: true,
            organizerId: true,
            isDeleted: true,
          },
        })
      : null;

    if (
      participant.groupId &&
      (!group?.tripId || group.tripId !== input.tripId || group.isDeleted)
    ) {
      throw new ORPCError("NOT_FOUND", { message: "Group not found" });
    }

    const removeCheck = canRemoveUserFromGroup(
      context.dbUser.role,
      group?.organizerId === context.dbUser.id,
      participant.userId,
      group?.organizerId ?? null,
    );
    if (removeCheck.error) {
      throw new ORPCError(removeCheck.error, { message: removeCheck.message });
    }

    const [updated] = await tx
      .update(tripParticipants)
      .set({ groupId: null })
      .where(eq(tripParticipants.id, participant.id))
      .returning();

    if (participant.groupId) {
      const membersLeftResult = await tx
        .select({ count: count() })
        .from(tripParticipants)
        .where(
          and(
            eq(tripParticipants.tripId, input.tripId),
            eq(tripParticipants.groupId, participant.groupId),
          ),
        );
      const membersLeft = membersLeftResult[0]?.count ?? 0;

      if (membersLeft === 0) {
        await tx
          .delete(groupJoinRequests)
          .where(eq(groupJoinRequests.groupId, participant.groupId));
        await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, participant.groupId));
      } else if (group?.organizerId && participant.userId === group.organizerId) {
        const groupId = participant.groupId;
        const matchTripAndGroup: WhereCallback<"tripParticipants"> = (tp, { and, eq }) =>
          and(eq(tp.tripId, input.tripId), eq(tp.groupId, groupId));
        const sortByCreatedAt: OrderByCallback<"tripParticipants"> = (tp, { asc }) => [
          asc(tp.createdAt),
        ];

        const nextOrganizer = await tx.query.tripParticipants.findFirst({
          where: matchTripAndGroup,
          orderBy: sortByCreatedAt,
          columns: { userId: true },
        });

        const nextOrganizerId = calculateNextOrganizer(nextOrganizer ? [nextOrganizer] : []);
        if (nextOrganizerId) {
          await tx
            .update(groups)
            .set({ organizerId: nextOrganizerId })
            .where(eq(groups.id, participant.groupId));
        }
      }
    }

    return updated;
  });
};

export const leaveMyGroup = async (context: GroupContext, input: { groupId: string }) => {
  await ensureTripNotEndedByGroupId(context.db, input.groupId);

  const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.groupId);

  const group = await context.db.query.groups.findFirst({
    where: matchGroupId,
    columns: { id: true, tripId: true, organizerId: true, isDeleted: true },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const matchUserAndTrip: WhereCallback<"tripParticipants"> = (tp, { and, eq }) =>
    and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, group.tripId));

  const membership = await context.db.query.tripParticipants.findFirst({
    where: matchUserAndTrip,
    columns: { groupId: true },
  });

  if (membership?.groupId !== group.id) {
    throw new ORPCError("FORBIDDEN", { message: "You are not a member of this group" });
  }

  const isOrganizer = group.organizerId === context.dbUser.id;

  if (!isOrganizer) {
    return await context.db.transaction(async (tx) => {
      await tx
        .update(tripParticipants)
        .set({ groupId: null })
        .where(
          and(
            eq(tripParticipants.userId, context.dbUser.id),
            eq(tripParticipants.tripId, group.tripId),
          ),
        );

      const membersLeftResult = await tx
        .select({ count: count() })
        .from(tripParticipants)
        .where(
          and(eq(tripParticipants.tripId, group.tripId), eq(tripParticipants.groupId, group.id)),
        );
      const membersLeft = membersLeftResult[0]?.count ?? 0;

      if (membersLeft === 0) {
        await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, group.id));
        await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, group.id));
        return buildLeaveResult(true, null, true);
      }

      return buildLeaveResult(true, null, false);
    });
  }

  const matchOtherMembers: WhereCallback<"tripParticipants"> = (tp, { and, eq, ne }) =>
    and(eq(tp.tripId, group.tripId), eq(tp.groupId, group.id), ne(tp.userId, context.dbUser.id));
  const sortByCreatedAt: OrderByCallback<"tripParticipants"> = (tp, { asc }) => [asc(tp.createdAt)];

  const remainingParticipants = await context.db.query.tripParticipants.findMany({
    where: matchOtherMembers,
    orderBy: sortByCreatedAt,
    columns: { userId: true },
  });

  const nextOrganizerId = calculateNextOrganizer(remainingParticipants);

  await context.db.transaction(async (tx) => {
    if (nextOrganizerId) {
      await tx.update(groups).set({ organizerId: nextOrganizerId }).where(eq(groups.id, group.id));
    } else {
      await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, group.id));
      await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, group.id));
    }

    await tx
      .update(tripParticipants)
      .set({ groupId: null })
      .where(
        and(
          eq(tripParticipants.userId, context.dbUser.id),
          eq(tripParticipants.tripId, group.tripId),
        ),
      );
  });

  return buildLeaveResult(true, nextOrganizerId, !nextOrganizerId);
};

export const addCoins = async (
  context: GroupContext,
  input: { groupId: string; amount: number; tripId: string },
) => {
  return await context.db.transaction(async (tx) => {
    const previousRankingSnapshot = await captureTripRankingSnapshot(tx, input.tripId);

    const matchGroupId: WhereCallback<"groups"> = (g, { eq }) => eq(g.id, input.groupId);

    const group = await tx.query.groups.findFirst({
      where: matchGroupId,
      columns: { id: true, tripId: true, isDeleted: true, coins: true },
    });
    if (group?.tripId !== input.tripId || group?.isDeleted) {
      throw new ORPCError("NOT_FOUND", { message: "Group not found" });
    }

    await tx
      .update(groups)
      .set({ coins: (group.coins ?? 0) + input.amount })
      .where(eq(groups.id, input.groupId));

    const [transaction] = await tx
      .insert(coinTransactions)
      .values({
        groupId: input.groupId,
        amount: input.amount,
        reason: "",
        adminId: context.dbUser.id,
      })
      .returning();

    if (!transaction) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create transaction" });
    }

    const matchTransactionId: WhereCallback<"coinTransactions"> = (ct, { eq }) =>
      eq(ct.id, transaction.id);

    const transactionWithGroup = await tx.query.coinTransactions.findFirst({
      where: matchTransactionId,
      with: {
        group: {
          columns: {
            id: true,
            name: true,
            coins: true,
          },
        },
      },
    });

    await createRankChangeActivities({
      tx,
      tripId: input.tripId,
      previousSnapshot: previousRankingSnapshot,
      createdByAdmin: context.dbUser.id,
    });

    return transactionWithGroup;
  });
};
