import { beforeEach, describe, expect, it, vi } from "vitest";
import { BUCKET_MAP, ensureBuckets, ensurePlaceholderImage, uploadAssets } from "../storage";

vi.mock("../config/env", () => ({
  env: {
    publicBucket: "files-public",
    imageBucket: "image",
    videoBucket: "video",
  },
}));

const mockListBuckets = vi.fn();
const mockCreateBucket = vi.fn();
const mockList = vi.fn();
const mockUpload = vi.fn();

vi.mock("../config/supabase", () => ({
  supabase: {
    storage: {
      listBuckets: () =>
        mockListBuckets() as Promise<{
          data: { name: string }[] | null;
          error: { message: string } | null;
        }>,
      createBucket: (name: string, options: object) =>
        mockCreateBucket(name, options) as Promise<{ error: { message: string } | null }>,
      from: (bucket: string) => ({
        list: (path: string, options: object) =>
          mockList(path, options) as Promise<{ data: unknown[]; error: null }>,
        upload: (path: string, file: unknown, options: object) =>
          mockUpload(bucket, path, file, options) as Promise<{ error: { message: string } | null }>,
      }),
    },
  },
}));

const mockListFilesRecursive = vi.fn();
const mockReadFile = vi.fn();
const mockJoinPath = vi.fn((...parts: string[]) => parts.join("/"));
const mockNormalizePath = vi.fn((p: string) => p);
const mockRelativePath = vi.fn((from: string, to: string) => to.replace(from + "/", ""));

vi.mock("../utils/fs", () => ({
  listFilesRecursive: (...args: unknown[]) => mockListFilesRecursive(...args) as Promise<string[]>,
  readFile: (path: string) =>
    mockReadFile(path) as { stream: () => unknown; stat: () => Promise<{ size: number }> },
}));

vi.mock("../utils/path", () => ({
  joinPath: (...args: string[]) => mockJoinPath(...args),
  normalizePath: (p: string) => mockNormalizePath(p),
  relativePath: (from: string, to: string) => mockRelativePath(from, to),
}));

vi.mock("../constants", () => ({
  assetsRoot: "/test/assets",
}));

describe("BUCKET_MAP", () => {
  it("should map public to publicBucket", () => {
    expect(BUCKET_MAP.public()).toBe("files-public");
  });

  it("should map images to imageBucket", () => {
    expect(BUCKET_MAP.images()).toBe("image");
  });

  it("should map videos to videoBucket", () => {
    expect(BUCKET_MAP.videos()).toBe("video");
  });

  it("should map trip/images to imageBucket", () => {
    expect(BUCKET_MAP["trip/images"]()).toBe("image");
  });

  it("should map trip/videos to videoBucket", () => {
    expect(BUCKET_MAP["trip/videos"]()).toBe("video");
  });

  it("should map rewards to imageBucket", () => {
    expect(BUCKET_MAP.rewards()).toBe("image");
  });
});

describe("ensureBuckets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create missing buckets", async () => {
    mockListBuckets.mockResolvedValue({
      data: [{ name: "files-public" }],
      error: null,
    });
    mockCreateBucket.mockResolvedValue({ error: null });

    await ensureBuckets();

    expect(mockListBuckets).toHaveBeenCalled();
    expect(mockCreateBucket).toHaveBeenCalledWith("image", { public: false });
    expect(mockCreateBucket).toHaveBeenCalledWith("video", { public: false });
  });

  it("should not create existing buckets", async () => {
    mockListBuckets.mockResolvedValue({
      data: [{ name: "files-public" }, { name: "image" }, { name: "video" }],
      error: null,
    });

    await ensureBuckets();

    expect(mockCreateBucket).not.toHaveBeenCalled();
  });

  it("should throw error if listBuckets fails", async () => {
    mockListBuckets.mockResolvedValue({
      data: null,
      error: { message: "Network error" },
    });

    await expect(ensureBuckets()).rejects.toThrow("listBuckets failed: Network error");
  });

  it("should throw error if createBucket fails", async () => {
    mockListBuckets.mockResolvedValue({
      data: [],
      error: null,
    });
    mockCreateBucket.mockResolvedValue({
      error: { message: "Permission denied" },
    });

    await expect(ensureBuckets()).rejects.toThrow(
      "createBucket files-public failed: Permission denied",
    );
  });

  it("should make public bucket public", async () => {
    mockListBuckets.mockResolvedValue({
      data: [],
      error: null,
    });
    mockCreateBucket.mockResolvedValue({ error: null });

    await ensureBuckets();

    expect(mockCreateBucket).toHaveBeenCalledWith("files-public", { public: true });
    expect(mockCreateBucket).toHaveBeenCalledWith("image", { public: false });
  });
});

describe("ensurePlaceholderImage", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
      /* noop */
    });
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });
  });

  it("should skip if placeholder already exists", async () => {
    mockList.mockResolvedValue({
      data: [{ name: "trip-background.png" }],
      error: null,
    });

    await ensurePlaceholderImage("dev");

    expect(mockList).toHaveBeenCalledWith("image/placeholder", { search: "trip-background.png" });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("✓ Placeholder image already exists");
  });

  it("should upload placeholder if not exists", async () => {
    mockList.mockResolvedValue({ data: [], error: null });
    const mockFile = { stream: () => ({}) };
    mockReadFile.mockReturnValue(mockFile);
    mockUpload.mockResolvedValue({ error: null });

    await ensurePlaceholderImage("dev");

    expect(mockReadFile).toHaveBeenCalledWith(
      "/test/assets/dev/images/placeholder/trip-background.png",
    );
    expect(mockUpload).toHaveBeenCalledWith(
      "image",
      "image/placeholder/trip-background.png",
      mockFile,
      expect.objectContaining({
        upsert: true,
        contentType: "image/png",
      }),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "✓ Uploaded placeholder image: image/placeholder/trip-background.png",
    );
  });

  it("should handle upload errors gracefully", async () => {
    mockList.mockResolvedValue({ data: [], error: null });
    const mockFile = { stream: () => ({}) };
    mockReadFile.mockReturnValue(mockFile);
    mockUpload.mockResolvedValue({ error: { message: "Upload failed" } });

    await ensurePlaceholderImage("dev");

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to upload placeholder image"),
    );
  });

  it("should handle missing placeholder file gracefully", async () => {
    mockList.mockResolvedValue({ data: [], error: null });
    mockReadFile.mockImplementation(() => {
      throw new Error("File not found");
    });

    await ensurePlaceholderImage("prod");

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Placeholder image file not found at"),
    );
  });
});

describe("uploadAssets", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {
      /* noop */
    });
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });
  });

  it("should upload files to correct buckets", async () => {
    const mockFile = {
      stream: () => ({}),
      stat: () => Promise.resolve({ size: 1024 }),
    };
    mockListFilesRecursive.mockResolvedValue([
      "/test/assets/dev/images/test.jpg",
      "/test/assets/dev/videos/test.mp4",
      "/test/assets/dev/public/doc.pdf",
    ]);
    mockReadFile.mockReturnValue(mockFile);
    mockUpload.mockResolvedValue({ error: null });

    await uploadAssets("dev");

    expect(mockUpload).toHaveBeenCalledWith("image", "test.jpg", mockFile, { upsert: true });
    expect(mockUpload).toHaveBeenCalledWith("video", "test.mp4", mockFile, { upsert: true });
    expect(mockUpload).toHaveBeenCalledWith("files-public", "doc.pdf", mockFile, { upsert: true });
  });

  it("should skip config and users directories", async () => {
    const mockFile = {
      stream: () => ({}),
      stat: () => Promise.resolve({ size: 1024 }),
    };
    mockListFilesRecursive.mockResolvedValue([
      "/test/assets/dev/config/trip.yaml",
      "/test/assets/dev/users/list.csv",
      "/test/assets/dev/images/test.jpg",
    ]);
    mockReadFile.mockReturnValue(mockFile);
    mockUpload.mockResolvedValue({ error: null });

    await uploadAssets("dev");

    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockUpload).toHaveBeenCalledWith("image", "test.jpg", mockFile, { upsert: true });
  });

  it("should handle rewards bucket mapping", async () => {
    const mockFile = {
      stream: () => ({}),
      stat: () => Promise.resolve({ size: 1024 }),
    };
    mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/rewards/pizza.jpg"]);
    mockReadFile.mockReturnValue(mockFile);
    mockUpload.mockResolvedValue({ error: null });

    await uploadAssets("dev");

    expect(mockUpload).toHaveBeenCalledWith("image", "rewards/pizza.jpg", mockFile, {
      upsert: true,
    });
  });

  it("should skip empty files", async () => {
    const mockFile = {
      stream: () => ({}),
      stat: () => Promise.resolve({ size: 0 }),
    };
    mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/images/empty.jpg"]);
    mockReadFile.mockReturnValue(mockFile);

    await uploadAssets("dev");

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("should handle upload errors gracefully", async () => {
    const mockFile = {
      stream: () => ({}),
      stat: () => Promise.resolve({ size: 1024 }),
    };
    mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/images/test.jpg"]);
    mockReadFile.mockReturnValue(mockFile);
    mockUpload.mockResolvedValue({ error: { message: "Quota exceeded" } });

    await uploadAssets("dev");

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("✗ Upload failed"));
  });

  it("should skip files not matching bucket prefixes", async () => {
    const mockFile = {
      stream: () => ({}),
      stat: () => Promise.resolve({ size: 1024 }),
    };
    mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/random/file.txt"]);
    mockReadFile.mockReturnValue(mockFile);

    await uploadAssets("dev");

    expect(mockUpload).not.toHaveBeenCalled();
  });
});
