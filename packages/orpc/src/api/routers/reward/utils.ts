import { eq } from "drizzle-orm";
import { type DB, challenges } from "@mirai-app/db";
import { resolveStorageUrl } from "@mirai-app/shared";
import { type RewardPurchaseStatus } from "./types";

export const calculateTotalAvailablePoints = async (db: DB, tripId: string) => {
  const challengeRows = await db
    .select({
      basePoints: challenges.basePoints,
      firstPlacePoints: challenges.firstPlacePoints,
      secondPlacePoints: challenges.secondPlacePoints,
      thirdPlacePoints: challenges.thirdPlacePoints,
      scoringCategory: challenges.scoringCategory,
    })
    .from(challenges)
    .where(eq(challenges.tripId, tripId));

  let totalPoints = 0;

  for (const challenge of challengeRows) {
    const basePoints = challenge.basePoints ?? 0;

    if (challenge.scoringCategory === "UNLIMITED") {
      totalPoints += basePoints;
    } else {
      totalPoints += basePoints;
      totalPoints += challenge.firstPlacePoints ?? 0;
      totalPoints += challenge.secondPlacePoints ?? 0;
      totalPoints += challenge.thirdPlacePoints ?? 0;
    }
  }

  return totalPoints;
};

export const canTransitionPurchaseStatus = (from: RewardPurchaseStatus, to: RewardPurchaseStatus) => {
  if (from === to) return true;

  const transitions: Record<RewardPurchaseStatus, RewardPurchaseStatus[]> = {
    BOUGHT: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["IN_DELIVERY", "CANCELLED"],
    IN_DELIVERY: ["DELIVERED", "CANCELLED"],
    CANCELLED: [],
    DELIVERED: [],
  };

  return transitions[from].includes(to);
};

export const resolveRewardImage = resolveStorageUrl;

export const parseRewardImages = (image: string | null | undefined): string[] => {
  if (!image) return [];

  const trimmed = image.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    }
  } catch {
    // Legacy single-image format.
  }

  return [trimmed];
};

export const normalizeRewardImagesInput = (images: string[] | undefined): string[] =>
  (images ?? []).map((image) => image.trim()).filter((image) => image.length > 0);

export const serializeRewardImages = (images: string[]): string | null => {
  if (images.length === 0) return null;
  if (images.length === 1) return images[0] ?? null;
  return JSON.stringify(images);
};

export const resolveRewardImageData = async (
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
      };
    };
  },
  image: string | null | undefined,
) => {
  const images = parseRewardImages(image);
  const signedImageCandidates = await Promise.all(
    images.map((item) => resolveRewardImage(supabase, item)),
  );
  const signedImageUrls = signedImageCandidates.filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );

  return {
    image: images[0] ?? null,
    signedImageUrl: signedImageCandidates[0] ?? null,
    images,
    signedImageUrls,
  };
};
