import {
  buildGalleryIndexBySubmissionId,
  buildGallerySubmissions,
  calculatePreviewRegularLimit,
  filterImageSubmissions,
  getPodiumSubmissions,
  getRegularSubmissions,
} from "../../../trips/challenges/ChallengeCommunitySubmissionsCard";

describe("ChallengeCommunitySubmissionsCard pure functions", () => {
  const baseSubmission = (overrides: Record<string, unknown> = {}) => ({
    id: "1",
    status: "APPROVED" as const,
    ranking: null as number | null,
    createdAt: "2024-01-01T10:00:00Z",
    imageIds: ["img1"],
    group: { id: "g1", name: "Group 1" },
    ...overrides,
  });

  describe("filterImageSubmissions", () => {
    it("keeps approved submissions with images", () => {
      const submissions = [baseSubmission()];
      expect(filterImageSubmissions(submissions)).toHaveLength(1);
    });

    it("filters out non-approved submissions", () => {
      const submissions = [baseSubmission({ status: "PENDING" })];
      expect(filterImageSubmissions(submissions)).toHaveLength(0);
    });

    it("filters out approved submissions without images", () => {
      const submissions = [baseSubmission({ imageIds: [] })];
      expect(filterImageSubmissions(submissions)).toHaveLength(0);
    });

    it("filters mixed submissions correctly", () => {
      const submissions = [
        baseSubmission({ id: "1" }),
        baseSubmission({ id: "2", status: "PENDING" }),
        baseSubmission({ id: "3", imageIds: [] }),
        baseSubmission({ id: "4" }),
      ];
      const result = filterImageSubmissions(submissions);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual(["1", "4"]);
    });
  });

  describe("getPodiumSubmissions", () => {
    const imageSubmissions = [
      baseSubmission({ id: "1", ranking: 1 }),
      baseSubmission({ id: "2", ranking: 3 }),
      baseSubmission({ id: "3", ranking: 2 }),
      baseSubmission({ id: "4", ranking: null }),
      baseSubmission({ id: "5", ranking: 5 }),
    ];

    it("returns empty array when showPodium is false", () => {
      expect(getPodiumSubmissions(imageSubmissions, false)).toEqual([]);
    });

    it("returns top 3 ranked submissions sorted", () => {
      const result = getPodiumSubmissions(imageSubmissions, true);
      expect(result).toHaveLength(3);
      expect(result.map((s) => s.id)).toEqual(["1", "3", "2"]);
    });

    it("excludes submissions with ranking outside 1-3", () => {
      const result = getPodiumSubmissions(imageSubmissions, true);
      expect(result.map((s) => s.id)).not.toContain("5");
    });
  });

  describe("getRegularSubmissions", () => {
    const imageSubmissions = [
      baseSubmission({ id: "1" }),
      baseSubmission({ id: "2" }),
      baseSubmission({ id: "3" }),
    ];

    it("returns all image submissions when showPodium is false", () => {
      const result = getRegularSubmissions(imageSubmissions, [], false);
      expect(result).toEqual(imageSubmissions);
    });

    it("excludes podium submissions from regular list", () => {
      const podiumSubmissions = [imageSubmissions[0]!];
      const result = getRegularSubmissions(imageSubmissions, podiumSubmissions, true);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual(["2", "3"]);
    });
  });

  describe("calculatePreviewRegularLimit", () => {
    it("returns PREVIEW_LIMIT when podium is disabled", () => {
      expect(calculatePreviewRegularLimit(false, 0)).toBe(9);
    });

    it("subtracts podium count from preview limit", () => {
      expect(calculatePreviewRegularLimit(true, 3)).toBe(6);
    });

    it("returns 0 when podium count exceeds limit", () => {
      expect(calculatePreviewRegularLimit(true, 12)).toBe(0);
    });
  });

  describe("buildGallerySubmissions", () => {
    const imageSubmissions = [baseSubmission({ id: "1" }), baseSubmission({ id: "2" })];
    const podiumSubmissions = [baseSubmission({ id: "3" })];
    const regularSubmissions = [baseSubmission({ id: "1" })];

    it("returns image submissions when podium is disabled", () => {
      expect(
        buildGallerySubmissions(false, podiumSubmissions, regularSubmissions, imageSubmissions),
      ).toEqual(imageSubmissions);
    });

    it("combines podium and regular submissions when podium is enabled", () => {
      const result = buildGallerySubmissions(
        true,
        podiumSubmissions,
        regularSubmissions,
        imageSubmissions,
      );
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe("3");
    });
  });

  describe("buildGalleryIndexBySubmissionId", () => {
    it("builds correct index map", () => {
      const submissions = [
        baseSubmission({ id: "a" }),
        baseSubmission({ id: "b" }),
        baseSubmission({ id: "c" }),
      ];
      const map = buildGalleryIndexBySubmissionId(submissions);
      expect(map.get("a")).toBe(0);
      expect(map.get("b")).toBe(1);
      expect(map.get("c")).toBe(2);
    });

    it("returns empty map for empty array", () => {
      const map = buildGalleryIndexBySubmissionId([]);
      expect(map.size).toBe(0);
    });
  });
});
