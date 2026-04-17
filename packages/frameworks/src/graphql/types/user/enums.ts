import { builder } from "../../builder.js";
import { UserRole } from "@mirai-app/domain";

/**
 * User Role Enum
 */
export const UserRoleEnum = builder.enumType("UserRole", {
  description: "User roles in the system",
  values: {
    USER: { value: UserRole.USER },
    MODERATOR: { value: UserRole.MODERATOR },
    ADMIN: { value: UserRole.ADMIN },
    SERVICE: { value: UserRole.SERVICE },
  },
});

/**
 * Create User Input
 */
export const CreateUserInput = builder.inputType("CreateUserInput", {
  description: "Input for creating a user",
  fields: (t) => ({
    authUserId: t.field({ type: "ID", required: true }),
    firstName: t.field({ type: "String", required: true }),
    lastName: t.field({ type: "String", required: true }),
    role: t.field({ type: UserRoleEnum }),
  }),
});

/**
 * Update User Input
 */
export const UpdateUserInput = builder.inputType("UpdateUserInput", {
  description: "Input for updating a user",
  fields: (t) => ({
    firstName: t.field({ type: "String" }),
    lastName: t.field({ type: "String" }),
    nickname: t.field({ type: "String" }),
    email: t.field({ type: "String" }),
    phone: t.field({ type: "String" }),
    bio: t.field({ type: "String" }),
    birthDate: t.field({ type: "DateTime" }),
    shirtSize: t.field({ type: "String" }),
    dietaryRequirements: t.field({ type: "String" }),
    medicalInfo: t.field({ type: "String" }),
  }),
});
