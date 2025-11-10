import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma, type User } from "@prisma/client";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Authentik from "next-auth/providers/authentik";
import { env } from "~/env";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      roles: string[];
      isAdmin: boolean;
      isModerator: boolean;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
  interface User {
    // ...other properties
    isAdmin: boolean;
    isModerator: boolean;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends User {
    isAdmin: boolean;
    isModerator: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends DefaultJWT {
    groups: string[];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  debug: env.NODE_ENV === "development",
  providers: [
    Authentik({
      clientId: process.env.AUTHENTIK_ID,
      clientSecret: process.env.AUTHENTIK_SECRET,
      issuer: process.env.AUTHENTIK_ISSUER,
      allowDangerousEmailAccountLinking: true,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    signIn: async ({ user, profile }) => {
      user.isAdmin =
        Array.isArray(profile?.groups) &&
        (profile.groups.includes(env.ADMIN_ROLE) ||
          profile.groups.includes(env.TECH_ROLE));
      user.isModerator =
        Array.isArray(profile?.groups) &&
        profile.groups.includes(env.MODERATOR_ROLE);
      try {
        if (user.email) {
          await db.user.update({
            where: { email: user.email },
            data: { isAdmin: user.isAdmin, isModerator: user.isModerator },
          });
        }
      } catch (e) {
        // Rethrow any error that isn't known. This error will get thrown
        // if we're trying to update a user in the database that doesn't exist
        // yet i.e. they're a new user.
        // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code !== "P2025") {
            throw e;
          }
        }
      }
      return true;
    },
    session: async ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          isAdmin: user.isAdmin ?? false,
          isModerator: user.isModerator ?? false,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
