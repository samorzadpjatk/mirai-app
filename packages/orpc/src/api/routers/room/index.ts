import { z } from "zod";
import { adminProcedure, createORPCRouter, protectedProcedure } from "../../orpc";
import {
  assignUserToRoom,
  bulkAssignUsersToRoom,
  create,
  deleteRoom,
  removeUserFromRoom,
  update,
} from "./mutations";
import { getAll, getById } from "./queries";

const handleGetAll = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAll>[0];
  input: Parameters<typeof getAll>[1];
}) => getAll(context, input);

const handleGetById = async ({
  context,
  input,
}: {
  context: Parameters<typeof getById>[0];
  input: Parameters<typeof getById>[1];
}) => getById(context, input);

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

const handleDeleteRoom = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteRoom>[0];
  input: Parameters<typeof deleteRoom>[1];
}) => deleteRoom(context, input);

const handleAssignUserToRoom = async ({
  context,
  input,
}: {
  context: Parameters<typeof assignUserToRoom>[0];
  input: Parameters<typeof assignUserToRoom>[1];
}) => assignUserToRoom(context, input);

const handleBulkAssignUsersToRoom = async ({
  context,
  input,
}: {
  context: Parameters<typeof bulkAssignUsersToRoom>[0];
  input: Parameters<typeof bulkAssignUsersToRoom>[1];
}) => bulkAssignUsersToRoom(context, input);

const handleRemoveUserFromRoom = async ({
  context,
  input,
}: {
  context: Parameters<typeof removeUserFromRoom>[0];
  input: Parameters<typeof removeUserFromRoom>[1];
}) => removeUserFromRoom(context, input);

export const roomRouter = createORPCRouter({
  // Every trip participant may view all rooms and their occupants.
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

  getById: protectedProcedure.input(z.object({ id: z.string() })).handler(handleGetById),

  // Room management is admin-only.
  create: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        capacity: z.number().int().min(1),
      }),
    )
    .handler(handleCreate),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        capacity: z.number().int().min(1).optional(),
      }),
    )
    .handler(handleUpdate),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(handleDeleteRoom),

  assignUserToRoom: adminProcedure
    .input(z.object({ userId: z.string(), tripId: z.string(), roomId: z.string() }))
    .handler(handleAssignUserToRoom),

  bulkAssignUsersToRoom: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        roomId: z.string(),
        userIds: z.array(z.string()).min(1),
      }),
    )
    .handler(handleBulkAssignUsersToRoom),

  removeUserFromRoom: adminProcedure
    .input(z.object({ userId: z.string(), tripId: z.string() }))
    .handler(handleRemoveUserFromRoom),
});
