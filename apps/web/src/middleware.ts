import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import { env } from "./lib/env";
import { clientLogger } from "@mirai-app/shared";

const PUBLIC_ROUTES = new Set(["/login"]);

const GET_ME_QUERY = `
  query GetMe {
    me {
      id
      role
    }
  }
`;

const getDbRole = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(env.graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: GET_ME_QUERY,
      }),
    });

    if (!response.ok) {
      clientLogger.error("[Middleware] GraphQL request failed:", {
        status: response.status,
      });
      return null;
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      clientLogger.error("[Middleware] GraphQL errors:", {
        errors: result.errors,
      });
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
  } catch (err) {
    clientLogger.error("[Middleware] getDbRole failed:", err as Error);
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
      clientLogger.error("[Middleware] Forbidden: role is not ADMIN");
      return new Response("Forbidden", { status: 403 });
    }
  }

  if (pathname === "/login") {
    return context.redirect("/");
  }

  return next();
});
