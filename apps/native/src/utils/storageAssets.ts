const SUPABASE_BASE_URL = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const SUPABASE_PUBLIC_STORAGE_BASE =
  `${SUPABASE_BASE_URL}/storage/v1/object/public`;

const toPublicStorageUrl = (storagePath: string): string => {
  const normalizedPath = storagePath.replace(/^\/+/, "");
  return `${SUPABASE_PUBLIC_STORAGE_BASE}/${normalizedPath}`;
};

const GROUP_PLACEHOLDER_STORAGE_PATH =
  process.env.EXPO_PUBLIC_GROUP_PLACEHOLDER_STORAGE_PATH?.trim() ||
  "app-static/images/group-placeholder.jpg";

const TRIP_INFO_HERO_IMAGE_STORAGE_PATH =
  process.env.EXPO_PUBLIC_TRIP_INFO_HERO_IMAGE_STORAGE_PATH?.trim() ||
  "app-static/images/trip-info-hero.jpg";

const TRIP_INFO_MAP_IMAGE_STORAGE_PATH =
  process.env.EXPO_PUBLIC_TRIP_INFO_MAP_IMAGE_STORAGE_PATH?.trim() ||
  "app-static/images/trip-info-map.jpg";

const TRIP_INFO_MAP_PDF_STORAGE_PATH =
  process.env.EXPO_PUBLIC_TRIP_INFO_MAP_PDF_STORAGE_PATH?.trim() ||
  "app-static/pdfs/verbier-piste-map-2024-25.pdf";

const TRIP_INFO_INFOPACK_STORAGE_PATH =
  process.env.EXPO_PUBLIC_TRIP_INFO_INFOPACK_STORAGE_PATH?.trim() ||
  "app-static/pdfs/infopack.pdf";

export const GROUP_PLACEHOLDER_IMAGE_URL = toPublicStorageUrl(
  GROUP_PLACEHOLDER_STORAGE_PATH,
);

export const TRIP_INFO_HERO_IMAGE_URL = toPublicStorageUrl(
  TRIP_INFO_HERO_IMAGE_STORAGE_PATH,
);

export const TRIP_INFO_MAP_IMAGE_URL = toPublicStorageUrl(
  TRIP_INFO_MAP_IMAGE_STORAGE_PATH,
);

export const TRIP_INFO_MAP_PDF_URL =
  process.env.EXPO_PUBLIC_MAP_PDF_URL?.trim() ||
  toPublicStorageUrl(TRIP_INFO_MAP_PDF_STORAGE_PATH);

export const TRIP_INFO_INFOPACK_PDF_URL =
  process.env.EXPO_PUBLIC_INFOPACK_PDF_URL?.trim() ||
  toPublicStorageUrl(TRIP_INFO_INFOPACK_STORAGE_PATH);
