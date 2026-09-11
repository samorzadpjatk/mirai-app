/**
 * Render sizes for storage images.
 *
 * Supabase Storage signs a URL to the *original* object unless a `transform` is
 * attached, so without these the app downloads full-resolution camera uploads to
 * paint a 40x40 avatar. Measured on production: a trip tile rendered at 130x52
 * pulled 4.4 MB, the same object at `tripTile` is 14 kB.
 *
 * No `format` is set on purpose: Storage runs imgproxy with WebP detection, so a
 * client sending `Accept: image/webp` gets WebP back automatically (a 1.5 MB PNG
 * background comes back as 49 kB), while older clients still get the source format.
 */
export interface ImageTransform {
  width: number;
  height: number;
  resize: "cover" | "contain" | "fill";
  quality: number;
}

export const IMAGE_TRANSFORMS = {
  /** 40x40 frame in feed cards and lists, at 3x device pixel ratio. */
  avatar: { width: 120, height: 120, resize: "cover", quality: 70 },
  /** 100x100 avatar on the profile header, at 3x. */
  profileAvatar: { width: 300, height: 300, resize: "cover", quality: 70 },
  /** 72-80px square thumbnails: submission circles, list tiles. */
  thumbnail: { width: 240, height: 240, resize: "cover", quality: 70 },
  /**
   * Sponsor wordmarks, in the 28px partner strip and the 220px detail header.
   * A logo is wide -- Netcompany is 3676x561 -- so it gets `contain`: `cover`
   * would fill the square by cropping away everything but the middle sixth.
   */
  logo: { width: 660, height: 660, resize: "contain", quality: 70 },
  /** 130x52 trip switcher tile on the community header, at 3x. */
  tripTile: { width: 390, height: 156, resize: "cover", quality: 70 },
  /** Full-width photo inside a feed card. */
  feedCard: { width: 1080, height: 1080, resize: "contain", quality: 70 },
  /** Full-bleed screen background. */
  hero: { width: 1080, height: 1080, resize: "cover", quality: 70 },
} as const satisfies Record<string, ImageTransform>;

export type ImageTransformName = keyof typeof IMAGE_TRANSFORMS;
