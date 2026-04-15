/**
 * Image Component - Tier 1 Primitive
 *
 * A cross-platform image component that renders consistently across web and native.
 * Built on top of Tamagui's Image primitive with theme-aware styling support.
 *
 * @example
 * ```tsx
 * // Basic usage with src
 * <Image src="https://example.com/photo.jpg" width={200} height={200} />
 *
 * // With objectFit (cover, contain, fill, none, scale-down)
 * <Image
 *   src="https://example.com/photo.jpg"
 *   width="100%"
 *   height={300}
 *   objectFit="cover"
 * />
 *
 * // React Native style source prop
 * <Image
 *   source={{ uri: "https://example.com/photo.jpg" }}
 *   width={200}
 *   height={200}
 *   resizeMode="cover"
 * />
 *
 * // With border radius
 * <Image
 *   src="https://example.com/photo.jpg"
 *   width={200}
 *   height={200}
 *   borderRadius="$lg"
 * />
 * ```
 *
 * @see https://tamagui.dev/docs/components/image
 */

import { Image as TamaguiImage } from "tamagui";
import type { ImageProps as TamaguiImageProps } from "tamagui";

/**
 * Props for the Image component
 * Extends Tamagui's Image props with cross-platform compatibility
 */
export interface ImageProps extends TamaguiImageProps {
  /**
   * React Native style source prop
   * Use this for React Native specific source objects with { uri }
   * @example { uri: "https://example.com/photo.jpg" }
   */
  source?: { uri: string } | number;

  /**
   * React Native resize mode (alias for objectFit on native)
   * Use this for React Native compatibility
   * - "cover": Scale to fill (clipping allowed)
   * - "contain": Scale to fit entirely
   * - "stretch": Stretch to fill
   * - "center": Center without scaling
   * - "repeat": Repeat image (iOS only)
   */
  resizeMode?: "cover" | "contain" | "stretch" | "center" | "repeat";
}

/**
 * Image component - Cross-platform image rendering
 *
 * Renders an image with consistent behavior across web and native:
 * - **Web**: Uses HTML `<img>` element with CSS object-fit
 * - **Native**: Uses React Native Image with resizeMode
 *
 * ## Features
 * - Cross-platform src/source prop support
 * - Tamagui style props (padding, margin, borderRadius, etc.)
 * - Theme-aware styling
 * - Accessibility support (alt text, screen readers)
 * - Lazy loading support on web
 *
 * ## Usage Guidelines
 * - Use `src` for URL strings (works on both platforms)
 * - Use `source` with `{ uri }` for React Native compatibility
 * - Use `objectFit` for web-style fitting
 * - Use `resizeMode` for React Native style fitting
 * - Always provide `alt` text for meaningful images
 *
 * @example
 * ```tsx
 * import { Image } from "@mirai-app/ui";
 *
 * // Basic image
 * <Image
 *   src="https://example.com/photo.jpg"
 *   width={200}
 *   height={200}
 *   alt="Description of the image"
 * />
 *
 * // Full-width cover image
 * <Image
 *   src="https://example.com/banner.jpg"
 *   width="100%"
 *   height={300}
 *   objectFit="cover"
 *   alt="Banner image"
 * />
 *
 * // Card thumbnail
 * <Image
 *   src={challenge.image}
 *   width={100}
 *   height={100}
 *   borderRadius="$md"
 *   resizeMode="cover"
 * />
 * ```
 */
/**
 * Image component - Cross-platform image rendering
 */
export const Image: React.FC<ImageProps> = TamaguiImage;

// Default export for convenience
export default Image;
