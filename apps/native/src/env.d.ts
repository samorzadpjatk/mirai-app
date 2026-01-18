/// <reference types="expo/types" />

// NOTE: This file should not be edited
// see https://expo.dev/docs/guides/environment-variables/ for more info

declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_SUPABASE_URL?: string;
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    readonly EXPO_PUBLIC_TRPC_API_URL?: string;
    readonly EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?: string;
    readonly MAPBOX_ACCESS_TOKEN?: string;
  }
}
