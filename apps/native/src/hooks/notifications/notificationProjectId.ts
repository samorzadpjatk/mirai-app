import Constants from "expo-constants";

export interface ProjectIdConstants {
  expoConfig?: { extra?: { eas?: { projectId?: unknown } } } | null;
  easConfig?: { projectId?: unknown } | null;
}

export function resolveProjectId(constants: ProjectIdConstants = Constants): string | undefined {
  const expoConfigExtra = (constants.expoConfig?.extra ?? null) as unknown;
  if (typeof expoConfigExtra === "object" && expoConfigExtra !== null) {
    const eas = (expoConfigExtra as { eas?: unknown }).eas;
    if (typeof eas === "object" && eas !== null) {
      const maybeProjectId = (eas as { projectId?: unknown }).projectId;
      if (typeof maybeProjectId === "string" && maybeProjectId.length > 0) {
        return maybeProjectId;
      }
    }
  }
  const easConfig = (constants.easConfig ?? null) as unknown;
  if (typeof easConfig === "object" && easConfig !== null) {
    const maybeProjectId = (easConfig as { projectId?: unknown }).projectId;
    if (typeof maybeProjectId === "string" && maybeProjectId.length > 0) {
      return maybeProjectId;
    }
  }
  return undefined;
}
