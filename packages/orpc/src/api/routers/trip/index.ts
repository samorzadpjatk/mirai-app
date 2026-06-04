import { z } from "zod";
import { adminProcedure, createORPCRouter, protectedProcedure } from "../../trpc";
import { createTrip, deleteTrip, updateTrip } from "./mutations";
import { getAll, getById, getByIdAdmin, getResources } from "./queries";

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

const handleGetByIdAdmin = async ({
  context,
  input,
}: {
  context: Parameters<typeof getByIdAdmin>[0];
  input: Parameters<typeof getByIdAdmin>[1];
}) => getByIdAdmin(context, input);

const handleGetResources = async ({
  context,
  input,
}: {
  context: Parameters<typeof getResources>[0];
  input: Parameters<typeof getResources>[1];
}) => getResources(context, input);

const handleCreateTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof createTrip>[0];
  input: Parameters<typeof createTrip>[1];
}) => createTrip(context, input);

const handleUpdateTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateTrip>[0];
  input: Parameters<typeof updateTrip>[1];
}) => updateTrip(context, input);

const handleDeleteTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteTrip>[0];
  input: Parameters<typeof deleteTrip>[1];
}) => deleteTrip(context, input);

export const tripRouter = createORPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(30),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .handler(handleGetAll),
  getById: protectedProcedure.input(z.object({ id: z.string() })).handler(handleGetById),
  getByIdAdmin: adminProcedure.input(z.object({ id: z.string() })).handler(handleGetByIdAdmin),
  getResources: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetResources),
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        backgroundImagePath: z.string().optional(),
      }),
    )
    .handler(handleCreateTrip),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        backgroundImagePath: z.string().optional(),
      }),
    )
    .handler(handleUpdateTrip),
  delete: adminProcedure.input(z.object({ id: z.string() })).handler(handleDeleteTrip),
});
