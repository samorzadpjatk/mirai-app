import { useEffect, useMemo, useState } from "react";
import type { UserLocation } from "~/components/map/UserMap";

interface UseMapUsersArgs {
  locationsByUserId: Record<
    string,
    { latitude: number; longitude: number; updatedAt: string | number | Date }
  >;
  usersData: Record<
    string,
    { name?: string; email?: string; image?: string; houseNumber?: string }
  >;
  session?: { user?: { id?: string; email?: string } } | null;
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
  currentCoordinate?: [number, number] | null;
}

export function useMapUsers({
  locationsByUserId,
  usersData,
  session,
  currentUserName,
  currentUserAvatarUrl,
  currentCoordinate,
}: UseMapUsersArgs) {
  const [effectiveNow, setEffectiveNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setEffectiveNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const withCacheBust = (
    imageUrl: string | null | undefined,
    version: string,
  ) => {
    if (!imageUrl) return null;
    const separator = imageUrl.includes("?") ? "&" : "?";
    return `${imageUrl}${separator}v=${encodeURIComponent(version)}`;
  };
  return useMemo<UserLocation[]>(() => {
    const next: UserLocation[] = [];
    const currentUserId = session?.user?.id;

    if (currentCoordinate) {
      const trimmedName = currentUserName?.trim();
      next.push({
        id: currentUserId ?? "me",
        name:
          trimmedName && trimmedName.length > 0
            ? trimmedName
            : (session?.user?.email ?? "You"),
        email: session?.user?.email ?? undefined,
        address: "Your location",
        coordinate: currentCoordinate,
        avatarUrl: currentUserAvatarUrl ?? null,
        lastActiveAt: effectiveNow.getTime(),
      });
    }

    Object.entries(locationsByUserId ?? {}).forEach(([userId, location]) => {
      if (userId === currentUserId) return;
      const userData = usersData?.[userId];
      next.push({
        id: userId,
        name: userData?.name ?? "Unknown",
        email: userData?.email,
        address: userData?.houseNumber
          ? `House ${userData.houseNumber}`
          : undefined,
        coordinate: [location.longitude, location.latitude],
        avatarUrl: withCacheBust(
          userData?.image,
          String(location.updatedAt),
        ),
        lastActiveAt:
          location.updatedAt instanceof Date
            ? location.updatedAt.getTime()
            : location.updatedAt,
      });
    });

    return next;
  }, [
    session?.user?.id,
    session?.user?.email,
    currentCoordinate,
    locationsByUserId,
    currentUserName,
    currentUserAvatarUrl,
    effectiveNow,
    usersData,
  ]);
}
