import { describe, it, expect } from "@jest/globals";
import { resolveProjectId, type ProjectIdConstants } from "~/hooks/notifications/notificationProjectId";

describe("resolveProjectId", () => {
  it("should return undefined when no config is available", () => {
    const result = resolveProjectId({ expoConfig: null, easConfig: null });
    expect(result).toBeUndefined();
  });

  it("should return projectId from expoConfig.extra.eas", () => {
    const constants: ProjectIdConstants = {
      expoConfig: { extra: { eas: { projectId: "project-123" } } },
    };
    const result = resolveProjectId(constants);
    expect(result).toBe("project-123");
  });

  it("should return undefined when eas object has no projectId", () => {
    const constants: ProjectIdConstants = {
      expoConfig: { extra: { eas: {} } },
    };
    const result = resolveProjectId(constants);
    expect(result).toBeUndefined();
  });

  it("should return projectId from easConfig fallback", () => {
    const constants: ProjectIdConstants = {
      easConfig: { projectId: "fallback-456" },
    };
    const result = resolveProjectId(constants);
    expect(result).toBe("fallback-456");
  });

  it("should prefer expoConfig over easConfig", () => {
    const constants: ProjectIdConstants = {
      expoConfig: { extra: { eas: { projectId: "primary-789" } } },
      easConfig: { projectId: "fallback-456" },
    };
    const result = resolveProjectId(constants);
    expect(result).toBe("primary-789");
  });

  it("should return undefined when projectId is empty string", () => {
    const constants: ProjectIdConstants = {
      expoConfig: { extra: { eas: { projectId: "" } } },
    };
    const result = resolveProjectId(constants);
    expect(result).toBeUndefined();
  });

  it("should return undefined when projectId is not a string", () => {
    const constants: ProjectIdConstants = {
      expoConfig: { extra: { eas: { projectId: 123 } } },
    };
    const result = resolveProjectId(constants);
    expect(result).toBeUndefined();
  });
});
