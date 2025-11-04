import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const providerMap = authConfig.providers
  .map((provider) => {
    return { id: provider.id, name: provider.name };
  })
  .filter((provider) => provider.id !== "credentials");

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut, providerMap };
