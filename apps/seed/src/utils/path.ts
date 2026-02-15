import path from "node:path";

export const normalizeFsPath = (value: string) => value.replace(/\\/g, "/");

export const normalizePath = (value: string) =>
  normalizeFsPath(value).replace(/^\/+/, "");

export const joinPath = (...parts: string[]) =>
  normalizeFsPath(path.join(...parts));

export const dirname = (filePath: string) =>
  normalizeFsPath(path.dirname(filePath));

export const basename = (filePath: string) => path.basename(filePath);

export const relativePath = (from: string, to: string) =>
  normalizeFsPath(path.relative(from, to));
