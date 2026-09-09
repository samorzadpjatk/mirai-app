import { STANDARD_BUCKETS } from "@mirai-app/common/storage";
import { describe, expect, it, vi } from "vitest";
import { resolveSeedStorageTarget } from "../storagePath";

vi.mock("../../config/env", () => ({
  env: {
    publicBucket: "files-public",
    imageBucket: "images",
    videoBucket: "videos",
  },
}));

const KNOWN_BUCKETS = new Set<string>(Object.values(STANDARD_BUCKETS));

describe("resolveSeedStorageTarget", () => {
  it("maps the public asset directory onto the files-public bucket", () => {
    expect(resolveSeedStorageTarget("public/integral/guide.pdf")).toEqual({
      bucket: "files-public",
      objectPath: "integral/guide.pdf",
      storagePath: "files-public/integral/guide.pdf",
      sourcePath: "public/integral/guide.pdf",
      knownPrefix: true,
    });
  });

  it("accepts the bucket name itself without doubling the prefix", () => {
    // A config author writing the real bucket name used to fall into the
    // unknown-prefix branch and upload to files-public/files-public/…
    expect(resolveSeedStorageTarget("files-public/integral/guide.pdf")).toEqual({
      bucket: "files-public",
      objectPath: "integral/guide.pdf",
      storagePath: "files-public/integral/guide.pdf",
      sourcePath: "public/integral/guide.pdf",
      knownPrefix: true,
    });
  });

  it("keeps image paths unchanged because the directory is the bucket name", () => {
    expect(resolveSeedStorageTarget("images/trips/integral/hero-bg.png")).toEqual({
      bucket: "images",
      objectPath: "trips/integral/hero-bg.png",
      storagePath: "images/trips/integral/hero-bg.png",
      sourcePath: "images/trips/integral/hero-bg.png",
      knownPrefix: true,
    });
  });

  it("maps the videos directory onto the videos bucket", () => {
    expect(resolveSeedStorageTarget("videos/trips/clip.mp4")).toMatchObject({
      bucket: "videos",
      objectPath: "trips/clip.mp4",
      storagePath: "videos/trips/clip.mp4",
      knownPrefix: true,
    });
  });

  it("ignores leading slashes", () => {
    expect(resolveSeedStorageTarget("/public/integral/guide.pdf")).toMatchObject({
      storagePath: "files-public/integral/guide.pdf",
      sourcePath: "public/integral/guide.pdf",
    });
  });

  it("flags an unrecognised prefix but still qualifies the reference", () => {
    expect(resolveSeedStorageTarget("unknown/path/file.txt")).toEqual({
      bucket: "files-public",
      objectPath: "unknown/path/file.txt",
      storagePath: "files-public/unknown/path/file.txt",
      sourcePath: "unknown/path/file.txt",
      knownPrefix: false,
    });
  });

  it("treats a bare prefix with no object as unrecognised", () => {
    expect(resolveSeedStorageTarget("public/")).toMatchObject({ knownPrefix: false });
  });

  it("always produces a reference whose first segment is a known bucket", () => {
    // storage.createDownloadUrl reads the first segment as a bucket name and
    // rejects the reference outright when it is not one, so this is the
    // invariant every seeded file row has to satisfy.
    const configured = [
      "public/integral/Integral2026-Przewodnik-Uczestnika.pdf",
      "public/maps/example-map.pdf",
      "files-public/legal/policy.pdf",
      "images/trips/integral/kacze-stawy.png",
      "videos/trips/intro.mp4",
      "unknown/path/file.txt",
    ];

    for (const path of configured) {
      const { storagePath } = resolveSeedStorageTarget(path);
      const [firstSegment, ...rest] = storagePath.split("/");
      expect(KNOWN_BUCKETS.has(firstSegment ?? "")).toBe(true);
      expect(rest.length).toBeGreaterThan(0);
    }
  });
});
