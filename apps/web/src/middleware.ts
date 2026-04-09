import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import { env } from "./lib/env";

const PUBLIC_ROUTES = new Set(["/login"]);

const getDbRole = async (accessToken: string): Promise<string | null> => {
  try {
    const trpcClient = createTRPCUntypedClient({
      links: [
        httpBatchLink({
          url: env.trpcUrl,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ],
    });

    const me = await trpcClient.query("user.getMy");
    // tRPC response with SuperJSON transformer has data in .json property
    const userData = (me as { json?: { role?: string } })?.json ?? me;
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
    console.error("[Middleware] getDbRole failed:", err);
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
      console.error("[Middleware] Forbidden: role is not ADMIN");
      return new Response("Forbidden", { status: 403 });
    }
  }

  if (pathname === "/login") {
    return context.redirect("/");
  }

  return next();
});
