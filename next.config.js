/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
  // Next.js config options here
};

const pwaConfig = {
  dest: "public",
  register: false, // Disable auto-registration in development to avoid conflicts
  skipWaiting: true,
  disable: isDev, // Disable PWA in development, we'll handle SW manually
  // Remove complex runtime caching for now to avoid type issues
  // The default next-pwa caching will still work
  runtimeCaching: []
};

const pwa = withPWA(pwaConfig)
export default pwa(nextConfig);
