import { createSupabaseClient } from "@integral-2025-app/auth";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: async (key: string) => {
            return cookieStore.get(key)?.value ?? null;
          },
          setItem: async (key: string, value: string) => {
            try {
              cookieStore.set(key, value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
              });
            } catch (error) {
              // Cookie modification is only allowed in Server Actions/Route Handlers
              // Silently fail during SSR/rendering
            }
          },
          removeItem: async (key: string) => {
            try {
              cookieStore.delete(key);
            } catch (error) {
              // Cookie modification is only allowed in Server Actions/Route Handlers
              // Silently fail during SSR/rendering
            }
          },
        },
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );
}
