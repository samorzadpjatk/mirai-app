import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import { env } from "./lib/env";
import {
  GetCurrentUserDocument,
  type GetCurrentUserQuery,
} from "@mirai-app/frameworks";

const PUBLIC_ROUTES = new Set(["/login"]);

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const getDbRole = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(env.graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: GetCurrentUserDocument.loc?.source.body,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result =
      (await response.json()) as GraphQLResponse<GetCurrentUserQuery>;

    if (result.errors && result.errors.length > 0) {
      return null;
    }

    const userData = result.data?.me;
    if (
      typeof userData === "object" &&
      userData !== null &&
      "role" in userData &&
      typeof userData.role === "string"
    ) {
      return userData.role;
    }

    return null;
  } catch {
    return null;
  }
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (pathname.startsWith("/_astro") || pathname.startsWith("/favicon")) {
    return next();
  }

  const token = context.cookies.get("sb-access-token")?.value;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (!token) {
    if (isPublicRoute) {
      return next();
    }

    return context.redirect("/login");
  }

  const supabase = createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    if (isPublicRoute) {
      return next();
    }
    return context.redirect("/login");
  }

  if (pathname !== "/login") {
    const roleFromDb = await getDbRole(token);
    const role =
      roleFromDb ?? (data.user.app_metadata?.role as string | undefined);

    if (typeof role !== "string" || role.toUpperCase() !== "ADMIN") {
      return new Response("Forbidden", { status: 403 });
    }
  }

  if (pathname === "/login") {
    return context.redirect("/");
  }

  return next();
});
