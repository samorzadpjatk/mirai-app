import { resolveStorageUrl } from "@mirai-app/common/storage";
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

  for (const group of groups) {
    if (group.organizer?.authUserId) {
      allAuthUserIds.add(group.organizer.authUserId);
    }
    for (const participant of group.participants) {
      if (participant.user.authUserId) {
        allAuthUserIds.add(participant.user.authUserId);
      }
    }
  }

  return await buildAuthEmailLookup(supabase, Array.from(allAuthUserIds));
};

export const generateFourDigitCode = () => {
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return String(1000 + ((array[0] as number) % 9000));
};

export const normalizeGroupImageInput = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeSupabaseStoragePath(value);
  if (normalized) {
    return normalized.storagePath;
  }
  return value;
};

export const resolveGroupImage = resolveStorageUrl;

export const toClientGroup = <T extends Record<string, unknown>>(group: T) => ({
  ...group,
  description: (group as { description?: string | null }).description ?? "",
  image: (group as { image?: string | null }).image ?? "",
});
