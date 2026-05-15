export const TRIP_RESOURCE_TYPES = {
  HERO_IMAGE: "hero_image",
  MAP_BG_IMAGE: "map_bg_image",
  INTERACTIVE_MAP: "interactive_map",
  PDF_MAP: "pdf_map",
  INFOPACK: "infopack",
  WHATSAPP: "whatsapp",
  SOS: "sos",
} as const;

export type TripResourceType = (typeof TRIP_RESOURCE_TYPES)[keyof typeof TRIP_RESOURCE_TYPES];
