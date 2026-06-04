import yaml from "yaml";
import type { TripConfig } from "./types";
import { listFilesRecursive, readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";

function isTripConfig(value: unknown): value is TripConfig {
  if (typeof value !== "object" || value === null) return false;
  const trip = value as Record<string, unknown>;
  return (
    typeof trip.key === "string" &&
    typeof trip.name === "string" &&
    typeof trip.startDate === "string" &&
    typeof trip.endDate === "string" &&
    typeof trip.users === "string"
  );
}

export const loadTripConfigs = async (envRoot: string): Promise<TripConfig[]> => {
  const configDir = joinPath(envRoot, "config");
  const files = await listFilesRecursive(configDir);
  const yamlFiles = files.filter((f: string) => f.endsWith(".yaml") || f.endsWith(".yml"));
  const trips: TripConfig[] = [];
  for (const file of yamlFiles) {
    const content = await readTextFile(file);
    const parsed: unknown = yaml.parse(content);
    if (isTripConfig(parsed)) {
      trips.push(parsed);
    }
  }
  return trips;
};
