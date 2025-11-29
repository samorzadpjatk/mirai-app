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
            const value = cookieStore.get(key)?.value;
            if (!value) return null;

            if (value.startsWith("base64-")) {
              try {
                return atob(value.substring(7));
              } catch (error) {
                console.error("Failed to decode base64 cookie:", error);
                return null;
              }
            }

            return value;
          },
          setItem: async (key: string, value: string) => {
            try {
              const encodedValue = `base64-${btoa(value)}`;
              cookieStore.set(key, encodedValue, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
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
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );
}
