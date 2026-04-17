/**
 * Tamagui Animation Configuration - Cross-Platform
 *
 * Provides Motion.dev-based animations for web and Moti-based animations for native.
 * The animation driver is selected automatically based on the platform.
 *
 * Motion.dev driver features:
 * - Off-thread Web Animations API for smooth performance
 * - Hardware-accelerated GPU animations
 * - Supports avoidReRenders for better performance
 *
 * @see https://tamagui.dev/docs/core/animations
 * @see https://motion.dev/
 */

import { createAnimations as createMotionAnimations } from "@tamagui/animations-motion";
import { createAnimations as createMotiAnimations } from "@tamagui/animations-moti";
import { isWeb } from "tamagui";

/**
 * Animation configuration values used by both drivers.
 * These define the timing and spring physics for all animations.
 */
const animationConfigs = {
  // Quick transitions for micro-interactions
  fast: {
    type: "spring" as const,
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },

  // Standard transitions for most UI animations
  medium: {
    type: "spring" as const,
    damping: 15,
    mass: 1,
    stiffness: 200,
  },

  // Slow, pronounced animations for emphasis
  slow: {
    type: "spring" as const,
    damping: 12,
    mass: 1.2,
    stiffness: 150,
  },

  // Bouncy animation for playful interactions
  bouncy: {
    type: "spring" as const,
    damping: 8,
    mass: 1.2,
    stiffness: 400,
  },

  // Smooth, gentle animations for modals/sheets
  smooth: {
    type: "spring" as const,
    damping: 25,
    mass: 1,
    stiffness: 120,
  },

  // Quick fade for overlays and backdrops
  fade: {
    type: "spring" as const,
    damping: 30,
    mass: 1,
    stiffness: 400,
  },

  // Scale animation for pop-in effects
  scale: {
    type: "spring" as const,
    damping: 18,
    mass: 0.8,
    stiffness: 300,
  },
};

/**
 * Motion.dev animation driver for web platforms.
 * Uses Web Animations API (WAAPI) for hardware-accelerated, off-thread animations.
 * Provides smooth 60fps animations on a separate thread from React.
 *
 * Features:
 * - Off-thread Web Animations API for smooth performance
 * - Hardware-accelerated GPU animations
 * - Automatic avoidReRenders behavior (handled internally by driver)
 * - Spring and tween animation support via Motion.dev library
 *
 * @see https://motion.dev/
 */
export const motionAnimations = createMotionAnimations(animationConfigs);

/**
 * Moti animation driver for native platforms.
 * Uses Moti (powered by Reanimated 3) for 60fps native-thread animations.
 * @see https://moti.fyi/
 */
export const motiAnimations = createMotiAnimations(animationConfigs);

/**
 * Platform-specific animation driver.
 * Automatically selects Motion.dev for web and Moti for native.
 */
export const animations = isWeb ? motionAnimations : motiAnimations;

/**
 * Individual animation presets for direct use in components.
 * These provide type-safe access to specific animation configurations.
 */
export const animationPresets = {
  fast: animationConfigs.fast,
  medium: animationConfigs.medium,
  slow: animationConfigs.slow,
  bouncy: animationConfigs.bouncy,
  smooth: animationConfigs.smooth,
  fade: animationConfigs.fade,
  scale: animationConfigs.scale,
};

export default animations;
