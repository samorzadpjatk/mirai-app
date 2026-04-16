import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "urql";
import { useFocusEffect } from "expo-router";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { useGetCurrentUserQuery } from "@mirai-app/frameworks";
import { useFileDownload } from "~/hooks/files";

const getRoleColor = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "$accentMagenta";
    case "MODERATOR":
      return "$primary";
    case "SERVICE":
      return "$slate400";
    default:
      return "$colorMuted";
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "MODERATOR":
      return "Moderator";
    case "SERVICE":
      return "Service";
    case "USER":
      return "User";
    default:
      return role;
  }
};

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case "ADMIN":
      return {
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        borderColor: "rgba(236, 72, 153, 0.3)",
      };
    case "MODERATOR":
      return {
        backgroundColor: "rgba(0, 206, 209, 0.1)",
        borderColor: "rgba(0, 206, 209, 0.3)",
      };
    case "SERVICE":
      return {
        backgroundColor: "rgba(148, 163, 184, 0.12)",
        borderColor: "rgba(148, 163, 184, 0.35)",
      };
    default:
      return {
        backgroundColor: "rgba(71, 85, 105, 0.15)",
        borderColor: "rgba(71, 85, 105, 0.35)",
      };
  }
};

export function ProfileHeader() {
  const [result] = useQuery({
    query: useGetCurrentUserQuery.document,
  });

  const { data } = result;

  const currentUser = data?.me;
  const {
    download: downloadAvatar,
    status: avatarStatus,
    file: avatarFile,
    reset: resetAvatar,
    abort: abortAvatar,
  } = useFileDownload();

  const avatarStoragePath = useMemo(() => {
    if (!currentUser?.id) return null;
    return `avatar/${currentUser.id}.jpg`;
  }, [currentUser?.id]);

  const first = currentUser?.firstName;
  const last = currentUser?.lastName;
  const roleValue = (currentUser?.role ?? "USER").toUpperCase();
  const initials = `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`;
  const roleColor = getRoleColor(roleValue);
  const roleBadgeStyle = getRoleBadgeStyle(roleValue);
  const isDownloading = avatarStatus === "loading";
  const avatarUri = avatarFile?.uri
    ? `${avatarFile.uri}?v=${encodeURIComponent(currentUser?.updatedAt?.toISOString() ?? "")}`
    : null;

  const refreshAvatar = useCallback(
    async (skipCache = false) => {
      if (!avatarStoragePath) return;
      resetAvatar();
      await downloadAvatar({ storagePath: avatarStoragePath, skipCache }).catch(
        () => undefined,
      );
    },
    [avatarStoragePath, downloadAvatar, resetAvatar],
  );

  useEffect(() => {
    if (!currentUser?.hasAvatar || !avatarStoragePath) {
      resetAvatar();
      return;
    }

    void refreshAvatar();

    return () => {
      abortAvatar();
    };
  }, [
    abortAvatar,
    avatarStoragePath,
    currentUser?.hasAvatar,
    currentUser?.updatedAt,
    refreshAvatar,
    resetAvatar,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!currentUser?.hasAvatar || !avatarStoragePath) return;
      void refreshAvatar(true);
    }, [avatarStoragePath, currentUser?.hasAvatar, refreshAvatar]),
  );

  return (
    <YStack alignItems="center" paddingVertical="$10" position="relative">
      <YStack
        width={100}
        height={100}
        borderRadius="$full"
        backgroundColor="$surface"
        borderWidth={3}
        borderColor="$primary"
        alignItems="center"
        justifyContent="center"
        marginBottom="$4"
        overflow="hidden"
        shadowColor="rgba(0, 206, 209, 0.3)"
        shadowOffset={{ width: 0, height: 0 }}
        shadowOpacity={0.3}
        shadowRadius={20}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="none"
          />
        ) : (
          <YStack
            width="100%"
            height="100%"
            alignItems="center"
            justifyContent="center"
            gap="$1"
          >
            <Text fontSize={36} fontWeight="$bold" color="$primary">
              {initials}
            </Text>
            {isDownloading && (
              <Text variant="caption" color="muted">
                Loading...
              </Text>
            )}
          </YStack>
        )}
      </YStack>

      <Text variant="h3" color="default" marginBottom="$2">
        {first} {last}
      </Text>

      <XStack
        alignItems="center"
        gap="$1"
        paddingHorizontal="$3"
        paddingVertical="$1"
        borderRadius="$full"
        borderWidth={1}
        {...roleBadgeStyle}
      >
        <Ionicons name="shield" size={14} color={roleColor as string} />
        <Text
          variant="caption"
          fontWeight="$bold"
          textTransform="uppercase"
          letterSpacing={1}
          color={roleColor as string}
        >
          {getRoleLabel(roleValue)}
        </Text>
      </XStack>
    </YStack>
  );
}
