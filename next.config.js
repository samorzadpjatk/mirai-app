// @ts-nocheck
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import withPWA from "next-pwa";

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Next.js config options here
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporary for deployment
  }
};

// PWA Configuration
const pwaConfig = {
  dest: "public",
  register: false, // Manual registration in our code
  skipWaiting: true,
  disable: false, // PWA enabled in both dev and production
  runtimeCaching: [],
};

// Export with PWA wrapper - always enabled
export default withPWA(pwaConfig)(nextConfig);
