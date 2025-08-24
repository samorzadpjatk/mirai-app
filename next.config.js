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
};

const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev, // Disable PWA in development for easier debugging
  // Remove complex runtime caching for now to avoid type issues
  // The default next-pwa caching will still work
  runtimeCaching: []
};

export default withPWA({
  ...nextConfig,
  ...pwaConfig
});
