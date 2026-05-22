import type { SupabaseClient } from "@mirai-app/supabase";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../../utils/authEmails";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";
import { resolveStorageUrl } from "@mirai-app/shared";

export const toUserWithEmail = <T extends { authUserId?: string | null }>(
  user: T,
  emailByAuthUserId: Map<string, string | null>,
) => {
  const { authUserId, ...rest } = user;
  return {
    ...rest,
    email: resolveAuthEmail(emailByAuthUserId, authUserId),
  };
};

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

export const resolveGroupImage = resolveStorageUrl;
