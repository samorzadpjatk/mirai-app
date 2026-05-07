import type { BunFile, Glob as GlobType } from "bun";
import { joinPath } from "./path";

export const fileExists = async (filePath: string): Promise<boolean> => {
  const bunFile: BunFile = Bun.file(filePath);
  const result: boolean = await bunFile.exists();
  return result;
};

export const dirExists = async (dirPath: string): Promise<boolean> => {
  const bunFile: BunFile = Bun.file(dirPath);
  const stat = await bunFile.stat();
  return stat.isDirectory();
};

export const readFile = (filePath: string): BunFile => {
  const bunFile: BunFile = Bun.file(filePath);
  return bunFile;
};

export const readTextFile = async (filePath: string): Promise<string> => {
  const bunFile: BunFile = Bun.file(filePath);
  const content: string = await bunFile.text();
  return content;
};

export const listFilesRecursive = async (rootDir: string): Promise<string[]> => {
  const doesDirExist = await dirExists(rootDir);
  if (!doesDirExist) return [];
  const glob: GlobType = new Bun.Glob("**/*");
  const files: string[] = [];
  for await (const file of glob.scan(rootDir)) {
    files.push(joinPath(rootDir, file));
  }
  return files;
};
