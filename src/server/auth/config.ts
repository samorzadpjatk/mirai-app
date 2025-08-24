import { PrismaAdapter } from "@auth/prisma-adapter";
import type { User } from "@prisma/client";
import { log } from "console";
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
      groups: string[];
      isAdmin: boolean;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
  interface User {
    // ...other properties
    isAdmin: boolean;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends User {
    isAdmin: boolean;
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
  debug: true,
  logger: {
    error(code, ...message) {
      log(code, message)
    },
    warn(code, ...message) {
      log(code, message)
    },
    debug(code, ...message) {
      log(code, message)
    },
  },
  providers: [
    Authentik({
      clientId: process.env.AUTHENTIK_ID,
      clientSecret: process.env.AUTHENTIK_SECRET,
      issuer: process.env.AUTHENTIK_ISSUER,
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
    jwt: async ({token, user, profile}) => {
      user.isAdmin = Array.isArray(profile?.groups) && (profile.groups.includes(env.ADMIN_ROLE) || profile.groups.includes(env.KADRA_ROLE))
      return token
    },
    session: async ({ session, user }) => {  
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          isAdmin: true,
        },
      };
    },
  },
  pages: {
    signIn: "/auth/login"
  }
} satisfies NextAuthConfig;
