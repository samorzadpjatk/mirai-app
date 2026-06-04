import { z } from "zod";
import {
  adminProcedure,
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import {
  banUserUntil,
  createUser,
  deleteUser,
  removeHouseNumber,
  removeWristNumber,
  updateAvatar,
  updateHouseNumber,
  updateMyProfile,
  updateName,
  updateUserAdminStatus,
  updateWristNumber,
} from "./mutations";
import {
  getAll,
  getAllAdminsNames,
  getBanStatus,
  getBanStatusByEmail,
  getById,
  getByIdWithGroup,
  getMy,
  getMyWithGroup,
  getTripParticipant,
  searchWithPagination,
} from "./queries";
import { nameSchema, roleSchema } from "./types";

const handleGetBanStatus = async ({ context }: { context: Parameters<typeof getBanStatus>[0] }) =>
  getBanStatus(context);

const handleGetBanStatusByEmail = async ({
  context,
  input,
}: {
  context: Parameters<typeof getBanStatusByEmail>[0];
  input: Parameters<typeof getBanStatusByEmail>[1];
}) => getBanStatusByEmail(context, input);

const handleGetById = async ({
  context,
  input,
}: {
  context: Parameters<typeof getById>[0];
  input: Parameters<typeof getById>[1];
}) => getById(context, input);

const handleGetTripParticipant = async ({
  context,
  input,
}: {
  context: Parameters<typeof getTripParticipant>[0];
  input: Parameters<typeof getTripParticipant>[1];
}) => getTripParticipant(context, input);

const handleGetByIdWithGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof getByIdWithGroup>[0];
  input: Parameters<typeof getByIdWithGroup>[1];
}) => getByIdWithGroup(context, input);

const handleGetMyWithGroup = async ({
  context,
  input,
}: {
  context: Parameters<typeof getMyWithGroup>[0];
  input: Parameters<typeof getMyWithGroup>[1];
}) => getMyWithGroup(context, input);

const handleGetMy = async ({ context }: { context: Parameters<typeof getMy>[0] }) => getMy(context);

const handleUpdateAvatar = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateAvatar>[0];
  input: Parameters<typeof updateAvatar>[1];
}) => updateAvatar(context, input);

const handleUpdateMyProfile = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateMyProfile>[0];
  input: Parameters<typeof updateMyProfile>[1];
}) => updateMyProfile(context, input);

const handleGetAll = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAll>[0];
  input: Parameters<typeof getAll>[1];
}) => getAll(context, input);

const handleGetAllAdminsNames = async ({
  context,
}: {
  context: Parameters<typeof getAllAdminsNames>[0];
}) => getAllAdminsNames(context);

const handleUpdateUserAdminStatus = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateUserAdminStatus>[0];
  input: Parameters<typeof updateUserAdminStatus>[1];
}) => updateUserAdminStatus(context, input);

const handleCreateUser = async ({
  context,
  input,
}: {
  context: Parameters<typeof createUser>[0];
  input: Parameters<typeof createUser>[1];
}) => createUser(context, input);

const handleUpdateName = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateName>[0];
  input: Parameters<typeof updateName>[1];
}) => updateName(context, input);

const handleBanUserUntil = async ({
  context,
  input,
}: {
  context: Parameters<typeof banUserUntil>[0];
  input: Parameters<typeof banUserUntil>[1];
}) => banUserUntil(context, input);

const handleDeleteUser = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteUser>[0];
  input: Parameters<typeof deleteUser>[1];
}) => deleteUser(context, input);

const handleUpdateWristNumber = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateWristNumber>[0];
  input: Parameters<typeof updateWristNumber>[1];
}) => updateWristNumber(context, input);

const handleRemoveWristNumber = async ({
  context,
  input,
}: {
  context: Parameters<typeof removeWristNumber>[0];
  input: Parameters<typeof removeWristNumber>[1];
}) => removeWristNumber(context, input);

const handleUpdateHouseNumber = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateHouseNumber>[0];
  input: Parameters<typeof updateHouseNumber>[1];
}) => updateHouseNumber(context, input);

const handleRemoveHouseNumber = async ({
  context,
  input,
}: {
  context: Parameters<typeof removeHouseNumber>[0];
  input: Parameters<typeof removeHouseNumber>[1];
}) => removeHouseNumber(context, input);

const handleSearchWithPagination = async ({
  context,
  input,
}: {
  context: Parameters<typeof searchWithPagination>[0];
  input: Parameters<typeof searchWithPagination>[1];
}) => searchWithPagination(context, input);

export const userRouter = createORPCRouter({
  getBanStatus: publicProcedure.handler(handleGetBanStatus),

  getBanStatusByEmail: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email("Invalid email"),
      }),
    )
    .handler(handleGetBanStatusByEmail),

  getById: moderatorProcedure.input(z.object({ id: z.string() })).handler(handleGetById),

  getTripParticipant: moderatorProcedure
    .input(z.object({ userId: z.string(), tripId: z.string() }))
    .handler(handleGetTripParticipant),

  getByIdWithGroup: moderatorProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(handleGetByIdWithGroup),

  getMyWithGroup: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetMyWithGroup),

  getMy: protectedProcedure.handler(handleGetMy),

  updateAvatar: protectedProcedure
    .input(z.object({ hasAvatar: z.boolean() }))
    .handler(handleUpdateAvatar),

  updateMyProfile: protectedProcedure
    .input(
      z.object({
        firstName: nameSchema,
        lastName: nameSchema,
      }),
    )
    .handler(handleUpdateMyProfile),

  getAll: moderatorProcedure.input(z.object({ tripId: z.string() })).handler(handleGetAll),

  getAllAdminsNames: moderatorProcedure.handler(handleGetAllAdminsNames),

  updateUserAdminStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: roleSchema,
      }),
    )
    .handler(handleUpdateUserAdminStatus),

  createUser: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email("Nieprawidłowy adres email"),
      }),
    )
    .handler(handleCreateUser),

  updateName: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        firstName: z.string().trim().min(1, "Imię jest wymagane"),
        lastName: z.string().trim().min(1, "Nazwisko jest wymagane"),
      }),
    )
    .handler(handleUpdateName),

  banUserUntil: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        bannedUntilMs: z.number(),
        reason: z.string().trim().optional(),
      }),
    )
    .handler(handleBanUserUntil),

  deleteUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(handleDeleteUser),

  updateWristNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
        wristNumber: z
          .string()
          .min(1, "Numer opaski nie może być pusty")
          .max(20, "Numer opaski nie może być dłuższy niż 20 znaków"),
      }),
    )
    .handler(handleUpdateWristNumber),

  removeWristNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(handleRemoveWristNumber),

  updateHouseNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
        houseNumber: z
          .string()
          .min(1, "Numer domu nie może być pusty")
          .max(20, "Numer domu nie może być dłuższy niż 20 znaków"),
      }),
    )
    .handler(handleUpdateHouseNumber),

  removeHouseNumber: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(handleRemoveHouseNumber),

  searchWithPagination: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        field: z.enum([
          "firstName",
          "lastName",
          "email",
          "wristNumber",
          "houseNumber",
          "groupName",
        ]),
        searchTerm: z.string().optional(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(20),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    )
    .handler(handleSearchWithPagination),
});
