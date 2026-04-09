export type {
  DatabaseUser,
  Role,
  AuthState,
  SignInWithOtpOptions,
} from "./types";

export type { AuthUser } from "../../stores/authStore";

// NOTE: Server-side auth functions (AuthServer, getServerUser, etc.)
// are available from @mirai-app/adapters/auth/authServer
// Import directly from adapters to avoid cyclic dependency:
//
// import { AuthServer, getServerUser } from "@mirai-app/adapters/auth/authServer";
