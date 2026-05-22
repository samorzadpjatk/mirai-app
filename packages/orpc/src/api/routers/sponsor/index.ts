import { createORPCRouter, adminProcedure, publicProcedure } from "../../trpc";
import {
  idInputSchema,
  tripIdInputSchema,
  createSponsorInputSchema,
  updateSponsorInputSchema,
  tripSponsorInputSchema,
} from "./types";
import { getAll, getById, getByTripId } from "./queries";
import { create, update, deleteSponsor, addToTrip, removeFromTrip } from "./mutations";

const handleGetAll = async ({
  context,
}: {
  context: Parameters<typeof getAll>[0];
}) => getAll(context);

const handleGetById = async ({
  context,
  input,
}: {
  context: Parameters<typeof getById>[0];
  input: Parameters<typeof getById>[1];
}) => getById(context, input);

const handleGetByTripId = async ({
  context,
  input,
}: {
  context: Parameters<typeof getByTripId>[0];
  input: Parameters<typeof getByTripId>[1];
}) => getByTripId(context, input);

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

const handleDeleteSponsor = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteSponsor>[0];
  input: Parameters<typeof deleteSponsor>[1];
}) => deleteSponsor(context, input);

const handleAddToTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof addToTrip>[0];
  input: Parameters<typeof addToTrip>[1];
}) => addToTrip(context, input);

const handleRemoveFromTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof removeFromTrip>[0];
  input: Parameters<typeof removeFromTrip>[1];
}) => removeFromTrip(context, input);

export const sponsorRouter = createORPCRouter({
  getAll: publicProcedure.handler(handleGetAll),

  getById: publicProcedure
    .input(idInputSchema)
    .handler(handleGetById),

  getByTripId: publicProcedure
    .input(tripIdInputSchema)
    .handler(handleGetByTripId),

  create: adminProcedure
    .input(createSponsorInputSchema)
    .handler(handleCreate),

  update: adminProcedure
    .input(updateSponsorInputSchema)
    .handler(handleUpdate),

  delete: adminProcedure
    .input(idInputSchema)
    .handler(handleDeleteSponsor),

  addToTrip: adminProcedure
    .input(tripSponsorInputSchema)
    .handler(handleAddToTrip),

  removeFromTrip: adminProcedure
    .input(tripSponsorInputSchema)
    .handler(handleRemoveFromTrip),
});
