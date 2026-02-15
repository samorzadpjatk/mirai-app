import { joinPath } from "./path";

export const fileExists = async (filePath: string) => Bun.file(filePath).exists();

export const dirExists = async (dirPath: string) => (await Bun.file(dirPath).stat()).isDirectory();

export const readFile = (filePath: string) => Bun.file(filePath);

export const readTextFile = async (filePath: string) => Bun.file(filePath).text();

export const listFilesRecursive = async (rootDir: string): Promise<string[]> => {
  const doesDirExist = await dirExists(rootDir);
  if (!doesDirExist) return [];
  const glob = new Bun.Glob("**/*");
  const files = await Array.fromAsync(glob.scan(rootDir));
  return files.map(file => joinPath(rootDir, file));
};
