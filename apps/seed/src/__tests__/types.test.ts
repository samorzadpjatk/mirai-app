import { describe, it, expect } from "vitest";
import type {
  SeedEnv,
  TripConfig,
  CsvUser,
  RewardConfig,
  SponsorConfig,
  TripResourceConfig,
  TripInsuranceStepConfig,
  TripInsuranceConfig,
  TripInfoConfig,
  AuthUserByEmail,
} from "../types";

describe("types", () => {
  describe("SeedEnv", () => {
    it("should accept 'dev' as valid SeedEnv", () => {
      const env: SeedEnv = "dev";
      expect(env).toBe("dev");
    });

    it("should accept 'prod' as valid SeedEnv", () => {
      const env: SeedEnv = "prod";
      expect(env).toBe("prod");
    });
  });

  describe("TripConfig", () => {
    it("should create valid TripConfig with required fields", () => {
      const config: TripConfig = {
        key: "test-trip",
        name: "Test Trip",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test.csv",
      };

      expect(config.key).toBe("test-trip");
      expect(config.name).toBe("Test Trip");
      expect(config.startDate).toBe("2026-01-01");
      expect(config.endDate).toBe("2026-01-10");
      expect(config.users).toBe("users/test.csv");
    });

    it("should create TripConfig with optional fields", () => {
      const config: TripConfig = {
        key: "full-trip",
        name: "Full Trip",
        description: "A complete trip configuration",
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        users: "users/full.csv",
        background: "images/background.jpg",
        rewards: "rewards/list.yaml",
        sponsors: "sponsors/list.yaml",
        info: "info/details.yaml",
      };

      expect(config.description).toBe("A complete trip configuration");
      expect(config.background).toBe("images/background.jpg");
      expect(config.rewards).toBe("rewards/list.yaml");
      expect(config.sponsors).toBe("sponsors/list.yaml");
      expect(config.info).toBe("info/details.yaml");
    });

    it("should allow optional fields to be undefined", () => {
      const config: TripConfig = {
        key: "minimal-trip",
        name: "Minimal Trip",
        startDate: "2026-03-01",
        endDate: "2026-03-05",
        users: "users/minimal.csv",
      };

      expect(config.description).toBeUndefined();
      expect(config.background).toBeUndefined();
      expect(config.rewards).toBeUndefined();
      expect(config.sponsors).toBeUndefined();
      expect(config.info).toBeUndefined();
    });
  });

  describe("CsvUser", () => {
    it("should create valid CsvUser with required fields", () => {
      const user: CsvUser = {
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      expect(user.email).toBe("test@example.com");
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
    });

    it("should create CsvUser with optional role", () => {
      const user: CsvUser = {
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      };

      expect(user.role).toBe("admin");
    });

    it("should allow role to be undefined", () => {
      const user: CsvUser = {
        email: "user@example.com",
        firstName: "Regular",
        lastName: "User",
      };

      expect(user.role).toBeUndefined();
    });
  });

  describe("RewardConfig", () => {
    it("should create valid RewardConfig with required fields", () => {
      const reward: RewardConfig = {
        name: "Free Pizza",
        description: "Get a free pizza",
        availableQuantity: 10,
        coinCost: 50,
      };

      expect(reward.name).toBe("Free Pizza");
      expect(reward.description).toBe("Get a free pizza");
      expect(reward.availableQuantity).toBe(10);
      expect(reward.coinCost).toBe(50);
    });

    it("should create RewardConfig with optional image", () => {
      const reward: RewardConfig = {
        name: "T-shirt",
        description: "Cool t-shirt",
        availableQuantity: 5,
        coinCost: 100,
        image: "rewards/tshirt.jpg",
      };

      expect(reward.image).toBe("rewards/tshirt.jpg");
    });

    it("should allow image to be undefined", () => {
      const reward: RewardConfig = {
        name: "Virtual Badge",
        description: "Digital badge",
        availableQuantity: 100,
        coinCost: 10,
      };

      expect(reward.image).toBeUndefined();
    });
  });

  describe("SponsorConfig", () => {
    it("should create valid SponsorConfig with required fields", () => {
      const sponsor: SponsorConfig = {
        id: "sponsor-1",
        name: "Acme Corp",
        description: "A great sponsor",
        logoPath: "images/sponsors/acme.png",
      };

      expect(sponsor.id).toBe("sponsor-1");
      expect(sponsor.name).toBe("Acme Corp");
      expect(sponsor.description).toBe("A great sponsor");
      expect(sponsor.logoPath).toBe("images/sponsors/acme.png");
    });

    it("should create SponsorConfig with optional fields", () => {
      const sponsor: SponsorConfig = {
        id: "sponsor-2",
        name: "Tech Inc",
        description: "Technology sponsor",
        logoPath: "images/sponsors/tech.png",
        height: 20,
        offsetX: 5,
        offsetY: 10,
      };

      expect(sponsor.height).toBe(20);
      expect(sponsor.offsetX).toBe(5);
      expect(sponsor.offsetY).toBe(10);
    });

    it("should allow optional fields to be undefined", () => {
      const sponsor: SponsorConfig = {
        id: "sponsor-3",
        name: "Simple Sponsor",
        description: "Simple description",
        logoPath: "images/sponsors/simple.png",
      };

      expect(sponsor.height).toBeUndefined();
      expect(sponsor.offsetX).toBeUndefined();
      expect(sponsor.offsetY).toBeUndefined();
    });
  });

  describe("TripResourceConfig", () => {
    it("should create valid TripResourceConfig with required fields", () => {
      const resource: TripResourceConfig = {
        type: "hero_image",
        label: "Hero Image",
      };

      expect(resource.type).toBe("hero_image");
      expect(resource.label).toBe("Hero Image");
    });

    it("should create TripResourceConfig with all optional fields", () => {
      const resource: TripResourceConfig = {
        type: "pdf_map",
        label: "Map PDF",
        description: "Trip map in PDF format",
        url: "https://example.com/map.pdf",
        storagePath: "public/maps/trip-map.pdf",
        fileName: "trip-map",
        publicUrl: "https://cdn.example.com/map.pdf",
        iconName: "document-text",
        value: "map-value",
        sortOrder: 1,
      };

      expect(resource.description).toBe("Trip map in PDF format");
      expect(resource.url).toBe("https://example.com/map.pdf");
      expect(resource.storagePath).toBe("public/maps/trip-map.pdf");
      expect(resource.fileName).toBe("trip-map");
      expect(resource.publicUrl).toBe("https://cdn.example.com/map.pdf");
      expect(resource.iconName).toBe("document-text");
      expect(resource.value).toBe("map-value");
      expect(resource.sortOrder).toBe(1);
    });
  });

  describe("TripInsuranceStepConfig", () => {
    it("should create valid TripInsuranceStepConfig with required fields", () => {
      const step: TripInsuranceStepConfig = {
        stepNumber: 1,
        title: "Step 1",
        text: "Do this first",
      };

      expect(step.stepNumber).toBe(1);
      expect(step.title).toBe("Step 1");
      expect(step.text).toBe("Do this first");
    });

    it("should create TripInsuranceStepConfig with optional fields", () => {
      const step: TripInsuranceStepConfig = {
        stepNumber: 2,
        title: "Step 2",
        text: "Do this next",
        requiredInfo: ["name", "date of birth"],
        exampleCall: "Hello, I need help with...",
        additionalText: "More details here",
      };

      expect(step.requiredInfo).toEqual(["name", "date of birth"]);
      expect(step.exampleCall).toBe("Hello, I need help with...");
      expect(step.additionalText).toBe("More details here");
    });
  });

  describe("TripInsuranceConfig", () => {
    it("should create valid TripInsuranceConfig with required fields", () => {
      const insurance: TripInsuranceConfig = {
        label: "Insurance Info",
        phoneNumber: "+1234567890",
        phoneDisplay: "+1 234 567 890",
        policyNumber: "POL123",
        contractNumber: "CTR456",
        providerName: "Insurance Co",
        steps: [],
      };

      expect(insurance.label).toBe("Insurance Info");
      expect(insurance.phoneNumber).toBe("+1234567890");
      expect(insurance.phoneDisplay).toBe("+1 234 567 890");
      expect(insurance.policyNumber).toBe("POL123");
      expect(insurance.contractNumber).toBe("CTR456");
      expect(insurance.providerName).toBe("Insurance Co");
      expect(insurance.steps).toEqual([]);
    });

    it("should create TripInsuranceConfig with optional fields", () => {
      const insurance: TripInsuranceConfig = {
        label: "Full Insurance",
        phoneNumber: "+9876543210",
        phoneDisplay: "+9 876 543 210",
        policyNumber: "POL789",
        contractNumber: "CTR012",
        providerName: "Full Insurance Co",
        hospitalName: "City Hospital",
        hospitalAddress: "123 Main St",
        hospitalDistance: "5km",
        steps: [
          {
            stepNumber: 1,
            title: "Call emergency",
            text: "Dial 911",
          },
        ],
      };

      expect(insurance.hospitalName).toBe("City Hospital");
      expect(insurance.hospitalAddress).toBe("123 Main St");
      expect(insurance.hospitalDistance).toBe("5km");
      expect(insurance.steps).toHaveLength(1);
    });
  });

  describe("TripInfoConfig", () => {
    it("should create valid TripInfoConfig with resources", () => {
      const info: TripInfoConfig = {
        resources: [
          { type: "hero_image", label: "Hero" },
          { type: "map", label: "Map" },
        ],
      };

      expect(info.resources).toHaveLength(2);
      expect(info.resources[0].type).toBe("hero_image");
      expect(info.resources[1].type).toBe("map");
    });

    it("should create TripInfoConfig with insurance", () => {
      const info: TripInfoConfig = {
        resources: [],
        insurance: {
          label: "Insurance",
          phoneNumber: "+123",
          phoneDisplay: "+1 23",
          policyNumber: "POL",
          contractNumber: "CTR",
          providerName: "Provider",
          steps: [],
        },
      };

      expect(info.insurance).toBeDefined();
      expect(info.insurance?.label).toBe("Insurance");
    });

    it("should allow insurance to be undefined", () => {
      const info: TripInfoConfig = {
        resources: [{ type: "hero_image", label: "Hero" }],
      };

      expect(info.insurance).toBeUndefined();
    });
  });

  describe("AuthUserByEmail", () => {
    it("should be a Map type", () => {
      const authUsers: AuthUserByEmail = new Map();
      expect(authUsers).toBeInstanceOf(Map);
    });

    it("should store SupabaseUser by email", () => {
      const authUsers: AuthUserByEmail = new Map();
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        created_at: new Date().toISOString(),
      } as any;

      authUsers.set("test@example.com", mockUser);

      expect(authUsers.get("test@example.com")).toBe(mockUser);
    });
  });
});
