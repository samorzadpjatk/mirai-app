import type { SupabaseClient } from "@mirai-app/supabase";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn().mockResolvedValue(new Map()),
}));

import { buildAuthEmailLookup } from "../../../../utils/authEmails";
import {
  batchEmailLookup,
  generateFourDigitCode,
  normalizeGroupImageInput,
  toClientGroup,
} from "../utils";

describe("group/utils - batchEmailLookup", () => {
  const mockSupabase = {} as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildAuthEmailLookup).mockResolvedValue(new Map());
  });

  it("collects auth user IDs from organizer and participants with authUserId", async () => {
    const groups = [
      {
        organizer: { authUserId: "auth-org-1" },
        participants: [
          { user: { authUserId: "auth-part-1" } },
          { user: { authUserId: "auth-part-2" } },
        ],
      },
    ];

    await batchEmailLookup(mockSupabase, groups);

    const passedIds = vi.mocked(buildAuthEmailLookup).mock.calls[0][1];
    expect(passedIds).toEqual(expect.arrayContaining(["auth-org-1", "auth-part-1", "auth-part-2"]));
    expect(passedIds).toHaveLength(3);
  });

  it("skips organizer when authUserId is null", async () => {
    const groups = [
      {
        organizer: { authUserId: null },
        participants: [{ user: { authUserId: "auth-part-1" } }],
      },
    ];

    await batchEmailLookup(mockSupabase, groups);

    const passedIds = vi.mocked(buildAuthEmailLookup).mock.calls[0][1];
    expect(passedIds).toEqual(["auth-part-1"]);
  });

  it("skips organizer when organizer is null or undefined", async () => {
    const groups = [
      {
        organizer: null,
        participants: [{ user: { authUserId: "auth-part-1" } }],
      },
      {
        organizer: undefined,
        participants: [{ user: { authUserId: "auth-part-2" } }],
      },
    ];

    await batchEmailLookup(mockSupabase, groups);

    const passedIds = vi.mocked(buildAuthEmailLookup).mock.calls[0][1];
    expect(passedIds).toEqual(expect.arrayContaining(["auth-part-1", "auth-part-2"]));
    expect(passedIds).toHaveLength(2);
  });

  it("skips participants when authUserId is null", async () => {
    const groups = [
      {
        organizer: { authUserId: "auth-org-1" },
        participants: [{ user: { authUserId: null } }, { user: { authUserId: "auth-part-1" } }],
      },
    ];

    await batchEmailLookup(mockSupabase, groups);

    const passedIds = vi.mocked(buildAuthEmailLookup).mock.calls[0][1];
    expect(passedIds).toEqual(expect.arrayContaining(["auth-org-1", "auth-part-1"]));
    expect(passedIds).toHaveLength(2);
  });

  it("handles empty groups array", async () => {
    await batchEmailLookup(mockSupabase, []);

    expect(buildAuthEmailLookup).toHaveBeenCalledWith(mockSupabase, []);
  });

  it("deduplicates auth user IDs across groups", async () => {
    const groups = [
      {
        organizer: { authUserId: "auth-1" },
        participants: [{ user: { authUserId: "auth-1" } }],
      },
      {
        organizer: { authUserId: "auth-1" },
        participants: [{ user: { authUserId: "auth-2" } }],
      },
    ];

    await batchEmailLookup(mockSupabase, groups);

    const passedIds = vi.mocked(buildAuthEmailLookup).mock.calls[0][1];
    expect(passedIds).toHaveLength(2);
    expect(passedIds).toEqual(expect.arrayContaining(["auth-1", "auth-2"]));
  });
});

describe("group/utils - generateFourDigitCode", () => {
  it("returns a 4-digit string between 1000 and 9999", () => {
    for (let i = 0; i < 100; i += 1) {
      const code = generateFourDigitCode();
      expect(code).toMatch(/^\d{4}$/);
      const numeric = Number(code);
      expect(numeric).toBeGreaterThanOrEqual(1000);
      expect(numeric).toBeLessThanOrEqual(9999);
    }
  });

  it("returns a string, not a number", () => {
    const code = generateFourDigitCode();
    expect(typeof code).toBe("string");
    expect(code).toHaveLength(4);
  });
});

describe("group/utils - normalizeGroupImageInput", () => {
  it("returns undefined for undefined input", () => {
    expect(normalizeGroupImageInput(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(normalizeGroupImageInput("")).toBeUndefined();
  });

  it("normalizes a group-prefixed path to a storage path", () => {
    const result = normalizeGroupImageInput("group/test-image.jpg");
    expect(result).toBe("images/group/test-image.jpg");
  });

  it("normalizes a full Supabase storage URL to a storage path", () => {
    const result = normalizeGroupImageInput(
      "https://example.supabase.co/storage/v1/object/public/images/group/test.jpg",
    );
    expect(result).toBe("images/group/test.jpg");
  });

  it("returns the original value when path cannot be normalized", () => {
    const result = normalizeGroupImageInput("some/unknown");
    expect(result).toBe("some/unknown");
  });
});

describe("group/utils - toClientGroup", () => {
  it("preserves description and image when present", () => {
    const result = toClientGroup({
      id: "g1",
      name: "Group 1",
      description: "A description",
      image: "images/test.jpg",
    });
    expect(result).toEqual({
      id: "g1",
      name: "Group 1",
      description: "A description",
      image: "images/test.jpg",
    });
  });

  it("defaults description to empty string when null", () => {
    const result = toClientGroup({ id: "g1", description: null, image: "img" });
    expect(result.description).toBe("");
  });

  it("defaults image to empty string when null", () => {
    const result = toClientGroup({ id: "g1", description: "desc", image: null });
    expect(result.image).toBe("");
  });

  it("defaults both description and image to empty string when undefined", () => {
    const result = toClientGroup({ id: "g1" });
    expect(result.description).toBe("");
    expect(result.image).toBe("");
  });

  it("spreads remaining properties", () => {
    const result = toClientGroup({ id: "g1", code: "1234", coins: 50 });
    expect(result.id).toBe("g1");
    expect(result.code).toBe("1234");
    expect(result.coins).toBe(50);
  });
});
