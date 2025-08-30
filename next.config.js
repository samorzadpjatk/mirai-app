// @ts-nocheck
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

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
  disable: isDev, // Disable PWA in development
  runtimeCaching: [],
};

// Export with PWA wrapper
export default isDev 
  ? nextConfig 
  : withPWA(pwaConfig)(nextConfig);
