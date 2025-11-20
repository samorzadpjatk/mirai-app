import { createServerSupabaseClient } from "~/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { env } from "~/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { user: supabaseUser } = data;

      const groups = (supabaseUser.user_metadata.groups as string[]) ?? [];
      const isAdmin =
        groups.includes(env.ADMIN_ROLE) || groups.includes(env.TECH_ROLE);
      const isModerator = groups.includes(env.MODERATOR_ROLE);
      const isServiceAccount = groups.includes(env.SERVICE_ACCOUNT_ROLE);

      await db.user.upsert({
        where: { authUserId: supabaseUser.id },
        create: {
          authUserId: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata.name as string | undefined,
          image: supabaseUser.user_metadata.avatar_url as string | undefined,
          emailVerified: supabaseUser.email_confirmed_at
            ? new Date(supabaseUser.email_confirmed_at)
            : null,
          isAdmin,
          isModerator,
          isServiceAccount,
        },
        update: {
          email: supabaseUser.email,
          name: supabaseUser.user_metadata.name as string | undefined,
          image: supabaseUser.user_metadata.avatar_url as string | undefined,
          emailVerified: supabaseUser.email_confirmed_at
            ? new Date(supabaseUser.email_confirmed_at)
            : null,
          isAdmin,
          isModerator,
          isServiceAccount,
        },
      });
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}
