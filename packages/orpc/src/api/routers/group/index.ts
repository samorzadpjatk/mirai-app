import { z } from "zod";
import {
  adminProcedure,
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../trpc";
import {
  addCoins,
  assignUserToGroup,
  bulkAssignUsersToGroup,
  cancelMyJoinRequest,
  create,
  deleteGroup,
  deleteMyGroup,
  join,
  leaveMyGroup,
  removeUserFromGroup,
  requestToJoin,
  respondToJoinRequest,
  update,
} from "./mutations";
import {
  getAll,
  getAllNames,
  getById,
  getByIdWithOrganizer,
  getGroupList,
  getMy,
  getMyJoinRequestForGroup,
  getPendingJoinRequests,
  ranking,
} from "./queries";
import { groupImageSchema, joinRequestDecisionSchema } from "./types";

const handleGetAllNames = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAllNames>[0];
  input: Parameters<typeof getAllNames>[1];
}) => getAllNames(context, input);

const handleGetMy = async ({
  context,
  input,
}: {
  context: Parameters<typeof getMy>[0];
  input: Parameters<typeof getMy>[1];
}) => getMy(context, input);

const handleGetAll = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAll>[0];
  input: Parameters<typeof getAll>[1];
}) => getAll(context, input);

const handleGetGroupList = async ({
  context,
  input,
}: {
  context: Parameters<typeof getGroupList>[0];
  input: Parameters<typeof getGroupList>[1];
}) => getGroupList(context, input);

const handleGetById = async ({
  context,
  input,
}: {
  context: Parameters<typeof getById>[0];
  input: Parameters<typeof getById>[1];
}) => getById(context, input);

const handleGetByIdWithOrganizer = async ({
  context,
  input,
}: {
  context: Parameters<typeof getByIdWithOrganizer>[0];
  input: Parameters<typeof getByIdWithOrganizer>[1];
}) => getByIdWithOrganizer(context, input);

const handleCreate = async ({
  context,
  input,
}: {
  context: Parameters<typeof create>[0];
  input: Parameters<typeof create>[1];
}) => create(context, input);

const handleUpdate = async ({
  context,
  input,
}: {
  context: Parameters<typeof update>[0];
  input: Parameters<typeof update>[1];
}) => update(context, input);

const handleDeleteGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteGroup>[0];
  input: Parameters<typeof deleteGroup>[1];
}) => deleteGroup(context, input);

const handleDeleteMyGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteMyGroup>[0];
  input: Parameters<typeof deleteMyGroup>[1];
}) => deleteMyGroup(context, input);

const handleJoin = async ({
  context,
  input,
}: {
  context: Parameters<typeof join>[0];
  input: Parameters<typeof join>[1];
}) => join(context, input);

const handleRequestToJoin = async ({
  context,
  input,
}: {
  context: Parameters<typeof requestToJoin>[0];
  input: Parameters<typeof requestToJoin>[1];
}) => requestToJoin(context, input);

const handleGetMyJoinRequestForGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof getMyJoinRequestForGroup>[0];
  input: Parameters<typeof getMyJoinRequestForGroup>[1];
}) => getMyJoinRequestForGroup(context, input);

const handleCancelMyJoinRequest = async ({
  context,
  input,
}: {
  context: Parameters<typeof cancelMyJoinRequest>[0];
  input: Parameters<typeof cancelMyJoinRequest>[1];
}) => cancelMyJoinRequest(context, input);

const handleGetPendingJoinRequests = async ({
  context,
  input,
}: {
  context: Parameters<typeof getPendingJoinRequests>[0];
  input: Parameters<typeof getPendingJoinRequests>[1];
}) => getPendingJoinRequests(context, input);

const handleRespondToJoinRequest = async ({
  context,
  input,
}: {
  context: Parameters<typeof respondToJoinRequest>[0];
  input: Parameters<typeof respondToJoinRequest>[1];
}) => respondToJoinRequest(context, input);

const handleAssignUserToGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof assignUserToGroup>[0];
  input: Parameters<typeof assignUserToGroup>[1];
}) => assignUserToGroup(context, input);

const handleBulkAssignUsersToGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof bulkAssignUsersToGroup>[0];
  input: Parameters<typeof bulkAssignUsersToGroup>[1];
}) => bulkAssignUsersToGroup(context, input);

const handleRemoveUserFromGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof removeUserFromGroup>[0];
  input: Parameters<typeof removeUserFromGroup>[1];
}) => removeUserFromGroup(context, input);

const handleLeaveMyGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof leaveMyGroup>[0];
  input: Parameters<typeof leaveMyGroup>[1];
}) => leaveMyGroup(context, input);

const handleAddCoins = async ({
  context,
  input,
}: {
  context: Parameters<typeof addCoins>[0];
  input: Parameters<typeof addCoins>[1];
}) => addCoins(context, input);

const handleRanking = async ({
  context,
  input,
}: {
  context: Parameters<typeof ranking>[0];
  input: Parameters<typeof ranking>[1];
}) => ranking(context, input);

export const groupRouter = createORPCRouter({
  getAllNames: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetAllNames),

  getMy: protectedProcedure.input(z.object({ tripId: z.string() })).handler(handleGetMy),

  getAll: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .handler(handleGetAll),

  getGroupList: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetGroupList),

  getById: protectedProcedure.input(z.object({ id: z.string() })).handler(handleGetById),

  getByIdWithOrganizer: moderatorProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(handleGetByIdWithOrganizer),

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        image: groupImageSchema,
        organizerId: z.string().optional(),
      }),
    )
    .handler(handleCreate),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: groupImageSchema,
        organizerId: z.string().optional(),
      }),
    )
    .handler(handleUpdate),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(handleDeleteGroup),

  deleteMyGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(handleDeleteMyGroup),

  join: adminProcedure.input(z.object({ id: z.string(), tripId: z.string() })).handler(handleJoin),

  requestToJoin: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(handleRequestToJoin),

  getMyJoinRequestForGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(handleGetMyJoinRequestForGroup),

  cancelMyJoinRequest: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(handleCancelMyJoinRequest),

  getPendingJoinRequests: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(handleGetPendingJoinRequests),

  respondToJoinRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        decision: joinRequestDecisionSchema,
      }),
    )
    .handler(handleRespondToJoinRequest),

  assignUserToGroup: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
        groupId: z.string(),
      }),
    )
    .handler(handleAssignUserToGroup),

  bulkAssignUsersToGroup: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        userIds: z.array(z.string()).min(1),
      }),
    )
    .handler(handleBulkAssignUsersToGroup),

  removeUserFromGroup: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(handleRemoveUserFromGroup),

  leaveMyGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .handler(handleLeaveMyGroup),

  addCoins: moderatorProcedure
    .input(z.object({ groupId: z.string(), amount: z.number(), tripId: z.string() }))
    .handler(handleAddCoins),

  ranking: protectedProcedure.input(z.object({ tripId: z.string() })).handler(handleRanking),
});

export { toClientGroup } from "./utils";
