import {
  DEFAULT_SIGNED_URL_SECONDS,
  IMAGE_TRANSFORMS,
  resolveStorageUrl,
} from "@mirai-app/common/storage";
import type { SupabaseClient } from "@mirai-app/supabase";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";
export { toUserWithEmail } from "@mirai-app/common/groups";

export const batchEmailLookup = async (
  supabase: SupabaseClient,
  groups: {
    organizer?: { authUserId?: string | null } | null;
    participants: { user: { authUserId?: string | null } }[];
  }[],
) => {
  const allAuthUserIds = new Set<string>();

  groups.forEach((group) => {
    if (group.organizer?.authUserId) {
      allAuthUserIds.add(group.organizer.authUserId);
    }
    group.participants.forEach((participant) => {
      if (participant.user.authUserId) {
        allAuthUserIds.add(participant.user.authUserId);
      }
    });
  });

  return await buildAuthEmailLookup(supabase, Array.from(allAuthUserIds));
};

export const generateFourDigitCode = () => {
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return String(1000 + (array[0]! % 9000));
};

export const normalizeGroupImageInput = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeSupabaseStoragePath(value);
  if (normalized) {
    return normalized.storagePath;
  }
  return value;
};

/** Group images only ever paint small round crests, so they are signed as thumbnails. */
export const resolveGroupImage = (
  supabase: Parameters<typeof resolveStorageUrl>[0],
  path: string | null | undefined,
  seconds: number = DEFAULT_SIGNED_URL_SECONDS,
) => resolveStorageUrl(supabase, path, seconds, IMAGE_TRANSFORMS.thumbnail);

export const toClientGroup = <T extends Record<string, unknown>>(group: T) => ({
  ...group,
  description: (group as { description?: string | null }).description ?? "",
  image: (group as { image?: string | null }).image ?? "",
});
