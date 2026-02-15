import yaml from "yaml";
import { listFilesRecursive, readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import type { TripConfig } from "./types";

export const loadTripConfigs = async (envRoot: string): Promise<TripConfig[]> => {
  const configDir = joinPath(envRoot, "config");
  const files = await listFilesRecursive(configDir);
  const yamlFiles = files.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  const trips: TripConfig[] = [];
  for (const file of yamlFiles) {
    const content = await readTextFile(file);
    const parsed = yaml.parse(content) as TripConfig;
    if (parsed?.key && parsed?.name && parsed?.startDate && parsed?.endDate && parsed?.users) {
      trips.push(parsed);
    }
  }
  return trips;
};
