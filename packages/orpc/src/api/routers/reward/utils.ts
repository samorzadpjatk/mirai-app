import { type DB, type TransactionDB, challenges } from "@mirai-app/db";
import { parseRewardImages, resolveStorageUrl } from "@mirai-app/shared";
import { eq } from "drizzle-orm";

export const calculateTotalAvailablePoints = async (db: DB | TransactionDB, tripId: string) => {
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

export const normalizeRewardImagesInput = (images: string[] | undefined): string[] =>
  (images ?? []).map((image) => image.trim()).filter((image) => image.length > 0);

const resolveRewardImage = resolveStorageUrl;

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
