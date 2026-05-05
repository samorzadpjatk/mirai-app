import { describe, it, expect } from "vitest";
import {
  TRIP_RESOURCE_TYPES,
  type TripResourceType,
} from "../types";

describe("TripInfo Types", () => {
  describe("TRIP_RESOURCE_TYPES constant", () => {
    it("should have HERO_IMAGE type", () => {
      expect(TRIP_RESOURCE_TYPES.HERO_IMAGE).toBe("hero_image");
    });

    it("should have MAP_BG_IMAGE type", () => {
      expect(TRIP_RESOURCE_TYPES.MAP_BG_IMAGE).toBe("map_bg_image");
    });

    it("should have INTERACTIVE_MAP type", () => {
      expect(TRIP_RESOURCE_TYPES.INTERACTIVE_MAP).toBe("interactive_map");
    });

    it("should have PDF_MAP type", () => {
      expect(TRIP_RESOURCE_TYPES.PDF_MAP).toBe("pdf_map");
    });

    it("should have INFOPACK type", () => {
      expect(TRIP_RESOURCE_TYPES.INFOPACK).toBe("infopack");
    });

    it("should have WHATSAPP type", () => {
      expect(TRIP_RESOURCE_TYPES.WHATSAPP).toBe("whatsapp");
    });

    it("should have SOS type", () => {
      expect(TRIP_RESOURCE_TYPES.SOS).toBe("sos");
    });

    it("should be frozen/as const", () => {
      // Verify the structure is correct
      expect(Object.keys(TRIP_RESOURCE_TYPES)).toHaveLength(7);
      expect(TRIP_RESOURCE_TYPES).toEqual({
        HERO_IMAGE: "hero_image",
        MAP_BG_IMAGE: "map_bg_image",
        INTERACTIVE_MAP: "interactive_map",
        PDF_MAP: "pdf_map",
        INFOPACK: "infopack",
        WHATSAPP: "whatsapp",
        SOS: "sos",
      });
    });

    it("should have string values only", () => {
      for (const [key, value] of Object.entries(TRIP_RESOURCE_TYPES)) {
        expect(typeof value).toBe("string");
        expect(value).not.toBe("");
      }
    });

    it("should have unique values", () => {
      const values = Object.values(TRIP_RESOURCE_TYPES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe("TripResourceType type", () => {
    it("should accept HERO_IMAGE value", () => {
      const type: TripResourceType = "hero_image";
      expect(type).toBe("hero_image");
    });

    it("should accept MAP_BG_IMAGE value", () => {
      const type: TripResourceType = "map_bg_image";
      expect(type).toBe("map_bg_image");
    });

    it("should accept INTERACTIVE_MAP value", () => {
      const type: TripResourceType = "interactive_map";
      expect(type).toBe("interactive_map");
    });

    it("should accept PDF_MAP value", () => {
      const type: TripResourceType = "pdf_map";
      expect(type).toBe("pdf_map");
    });

    it("should accept INFOPACK value", () => {
      const type: TripResourceType = "infopack";
      expect(type).toBe("infopack");
    });

    it("should accept WHATSAPP value", () => {
      const type: TripResourceType = "whatsapp";
      expect(type).toBe("whatsapp");
    });

    it("should accept SOS value", () => {
      const type: TripResourceType = "sos";
      expect(type).toBe("sos");
    });

    it("should work with all valid values", () => {
      const allTypes: TripResourceType[] = [
        "hero_image",
        "map_bg_image",
        "interactive_map",
        "pdf_map",
        "infopack",
        "whatsapp",
        "sos",
      ];

      expect(allTypes).toHaveLength(7);
      
      for (const type of allTypes) {
        expect(typeof type).toBe("string");
        expect(Object.values(TRIP_RESOURCE_TYPES)).toContain(type);
      }
    });
  });

  describe("Type Safety", () => {
    it("should allow using TRIP_RESOURCE_TYPES values as TripResourceType", () => {
      function processResourceType(type: TripResourceType): string {
        return type;
      }

      // All values from the constant should be valid
      expect(processResourceType(TRIP_RESOURCE_TYPES.HERO_IMAGE)).toBe("hero_image");
      expect(processResourceType(TRIP_RESOURCE_TYPES.MAP_BG_IMAGE)).toBe("map_bg_image");
      expect(processResourceType(TRIP_RESOURCE_TYPES.INTERACTIVE_MAP)).toBe("interactive_map");
      expect(processResourceType(TRIP_RESOURCE_TYPES.PDF_MAP)).toBe("pdf_map");
      expect(processResourceType(TRIP_RESOURCE_TYPES.INFOPACK)).toBe("infopack");
      expect(processResourceType(TRIP_RESOURCE_TYPES.WHATSAPP)).toBe("whatsapp");
      expect(processResourceType(TRIP_RESOURCE_TYPES.SOS)).toBe("sos");
    });

    it("should work in object structures", () => {
      interface TripResource {
        id: string;
        type: TripResourceType;
        url: string;
      }

      const resources: TripResource[] = [
        {
          id: "1",
          type: TRIP_RESOURCE_TYPES.HERO_IMAGE,
          url: "https://example.com/hero.jpg",
        },
        {
          id: "2",
          type: TRIP_RESOURCE_TYPES.PDF_MAP,
          url: "https://example.com/map.pdf",
        },
        {
          id: "3",
          type: TRIP_RESOURCE_TYPES.SOS,
          url: "tel:123456789",
        },
      ];

      expect(resources).toHaveLength(3);
      expect(resources[0].type).toBe("hero_image");
      expect(resources[1].type).toBe("pdf_map");
      expect(resources[2].type).toBe("sos");
    });

    it("should work in switch statements", () => {
      function getResourceLabel(type: TripResourceType): string {
        switch (type) {
          case TRIP_RESOURCE_TYPES.HERO_IMAGE:
            return "Hero Image";
          case TRIP_RESOURCE_TYPES.MAP_BG_IMAGE:
            return "Map Background";
          case TRIP_RESOURCE_TYPES.INTERACTIVE_MAP:
            return "Interactive Map";
          case TRIP_RESOURCE_TYPES.PDF_MAP:
            return "PDF Map";
          case TRIP_RESOURCE_TYPES.INFOPACK:
            return "Infopack";
          case TRIP_RESOURCE_TYPES.WHATSAPP:
            return "WhatsApp";
          case TRIP_RESOURCE_TYPES.SOS:
            return "SOS";
          default:
            return "Unknown";
        }
      }

      expect(getResourceLabel("hero_image")).toBe("Hero Image");
      expect(getResourceLabel("map_bg_image")).toBe("Map Background");
      expect(getResourceLabel("interactive_map")).toBe("Interactive Map");
      expect(getResourceLabel("pdf_map")).toBe("PDF Map");
      expect(getResourceLabel("infopack")).toBe("Infopack");
      expect(getResourceLabel("whatsapp")).toBe("WhatsApp");
      expect(getResourceLabel("sos")).toBe("SOS");
    });

    it("should work with type guards", () => {
      function isValidResourceType(value: string): value is TripResourceType {
        return Object.values(TRIP_RESOURCE_TYPES).includes(value as TripResourceType);
      }

      expect(isValidResourceType("hero_image")).toBe(true);
      expect(isValidResourceType("map_bg_image")).toBe(true);
      expect(isValidResourceType("invalid_type")).toBe(false);
      expect(isValidResourceType("")).toBe(false);
      expect(isValidResourceType("random")).toBe(false);
    });
  });

  describe("Usage Patterns", () => {
    it("should support array iteration", () => {
      const allTypes = Object.values(TRIP_RESOURCE_TYPES);
      
      const labels = allTypes.map((type) => {
        return type.replace(/_/g, " ").toUpperCase();
      });

      expect(labels).toEqual([
        "HERO IMAGE",
        "MAP BG IMAGE",
        "INTERACTIVE MAP",
        "PDF MAP",
        "INFOPACK",
        "WHATSAPP",
        "SOS",
      ]);
    });

    it("should support filtering", () => {
      const allTypes = Object.values(TRIP_RESOURCE_TYPES);
      
      const mapTypes = allTypes.filter((type) => 
        type.includes("map")
      );

      expect(mapTypes).toEqual([
        "map_bg_image",
        "interactive_map",
        "pdf_map",
      ]);
    });

    it("should support lookup by key", () => {
      function getTypeByKey(key: keyof typeof TRIP_RESOURCE_TYPES): TripResourceType | undefined {
        return TRIP_RESOURCE_TYPES[key];
      }

      expect(getTypeByKey("HERO_IMAGE")).toBe("hero_image");
      expect(getTypeByKey("SOS")).toBe("sos");
      expect(getTypeByKey("WHATSAPP")).toBe("whatsapp");
    });

    it("should support reverse lookup", () => {
      function getKeyByType(type: TripResourceType): keyof typeof TRIP_RESOURCE_TYPES | undefined {
        const entries = Object.entries(TRIP_RESOURCE_TYPES) as [
          keyof typeof TRIP_RESOURCE_TYPES,
          TripResourceType
        ][];
        
        const found = entries.find(([, value]) => value === type);
        return found?.[0];
      }

      expect(getKeyByType("hero_image")).toBe("HERO_IMAGE");
      expect(getKeyByType("sos")).toBe("SOS");
      expect(getKeyByType("infopack")).toBe("INFOPACK");
    });
  });

  describe("Integration with other types", () => {
    it("should work in complex interfaces", () => {
      interface Trip {
        id: string;
        name: string;
        resources: Array<{
          type: TripResourceType;
          url: string;
          metadata?: Record<string, unknown>;
        }>;
      }

      const trip: Trip = {
        id: "trip-1",
        name: "Summer Trip",
        resources: [
          {
            type: TRIP_RESOURCE_TYPES.HERO_IMAGE,
            url: "https://example.com/hero.jpg",
            metadata: { width: 1920, height: 1080 },
          },
          {
            type: TRIP_RESOURCE_TYPES.INTERACTIVE_MAP,
            url: "https://example.com/map",
          },
        ],
      };

      expect(trip.resources).toHaveLength(2);
      expect(trip.resources[0].type).toBe("hero_image");
    });

    it("should work with utility types", () => {
      type ResourceConfig = {
        [K in TripResourceType]?: {
          enabled: boolean;
          required: boolean;
        };
      };

      const config: ResourceConfig = {
        hero_image: { enabled: true, required: true },
        pdf_map: { enabled: true, required: false },
        sos: { enabled: true, required: true },
      };

      expect(config.hero_image?.enabled).toBe(true);
      expect(config.pdf_map?.required).toBe(false);
    });
  });
});
