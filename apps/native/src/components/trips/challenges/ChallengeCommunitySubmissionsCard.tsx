import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Card, Text, XStack, YStack, Image } from "@mirai-app/ui";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CommunitySubmission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  ranking?: number | null;
  createdAt: string | Date;
  imageIds: string[];
  group: {
    id: string;
    name: string;
  };
}

interface ChallengeCommunitySubmissionsCardProps {
  submissions: CommunitySubmission[];
  showPodium: boolean;
}

const PREVIEW_LIMIT = 9;

const placeStyleMap: Record<number, { borderColor: string; label: string }> = {
  1: { borderColor: "#facc15", label: "1st Place" },
  2: { borderColor: "#cbd5e1", label: "2nd Place" },
  3: { borderColor: "#d97706", label: "3rd Place" },
};

const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

export function ChallengeCommunitySubmissionsCard({
  submissions,
  showPodium,
}: ChallengeCommunitySubmissionsCardProps) {
  const insets = useSafeAreaInsets();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryListRef = useRef<FlatList<CommunitySubmission>>(null);
  const { width, height } = useWindowDimensions();

  const imageSubmissions = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.status === "APPROVED" && Boolean(submission.imageIds[0]),
      ),
    [submissions],
  );

  const podiumSubmissions = useMemo(() => {
    if (!showPodium) return [];
    return imageSubmissions
      .filter(
        (submission) =>
          submission.status === "APPROVED" &&
          typeof submission.ranking === "number" &&
          submission.ranking >= 1 &&
          submission.ranking <= 3,
      )
      .sort((a, b) => (a.ranking ?? 99) - (b.ranking ?? 99));
  }, [imageSubmissions, showPodium]);

  const podiumByRank = useMemo(
    () =>
      new Map(
        podiumSubmissions.map((submission) => [
          submission.ranking!,
          submission,
        ]),
      ),
    [podiumSubmissions],
  );

  const regularSubmissions = useMemo(() => {
    if (!showPodium) return imageSubmissions;
    const podiumIds = new Set(
      podiumSubmissions.map((submission) => submission.id),
    );
    return imageSubmissions.filter(
      (submission) => !podiumIds.has(submission.id),
    );
  }, [imageSubmissions, podiumSubmissions, showPodium]);

  const previewRegularLimit = showPodium
    ? Math.max(0, PREVIEW_LIMIT - podiumSubmissions.length)
    : PREVIEW_LIMIT;
  const previewRegularSubmissions = regularSubmissions.slice(
    0,
    previewRegularLimit,
  );

  const gallerySubmissions = useMemo(
    () =>
      showPodium
        ? [...podiumSubmissions, ...regularSubmissions]
        : imageSubmissions,
    [imageSubmissions, podiumSubmissions, regularSubmissions, showPodium],
  );

  const galleryIndexBySubmissionId = useMemo(
    () =>
      new Map(
        gallerySubmissions.map((submission, index) => [submission.id, index]),
      ),
    [gallerySubmissions],
  );

  const hasAnySubmissions = imageSubmissions.length > 0;

  const openGalleryAt = useCallback(
    (submissionId?: string) => {
      if (!gallerySubmissions.length) return;
      const nextIndex = submissionId
        ? (galleryIndexBySubmissionId.get(submissionId) ?? 0)
        : 0;
      setActiveGalleryIndex(nextIndex);
      setIsGalleryOpen(true);
    },
    [galleryIndexBySubmissionId, gallerySubmissions.length],
  );

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  useEffect(() => {
    if (!isGalleryOpen || gallerySubmissions.length === 0) return;

    const boundedIndex = Math.max(
      0,
      Math.min(activeGalleryIndex, gallerySubmissions.length - 1),
    );
    const timeoutId = setTimeout(() => {
      galleryListRef.current?.scrollToIndex({
        index: boundedIndex,
        animated: false,
      });
    }, 30);

    return () => clearTimeout(timeoutId);
  }, [activeGalleryIndex, gallerySubmissions.length, isGalleryOpen]);

  const handleGalleryScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / Math.max(width, 1));
      const boundedIndex = Math.max(
        0,
        Math.min(nextIndex, Math.max(gallerySubmissions.length - 1, 0)),
      );
      if (boundedIndex !== activeGalleryIndex) {
        setActiveGalleryIndex(boundedIndex);
      }
    },
    [activeGalleryIndex, gallerySubmissions.length, width],
  );

  return (
    <Card
      marginBottom="$4"
      borderWidth={1}
      borderColor="rgba(255,255,255,0.08)"
      padding="0"
      overflow="hidden"
    >
      <YStack paddingHorizontal="$4" paddingTop="$3" paddingBottom="$2">
        <Text variant="body" fontWeight="$bold" color="white">
          Groups submissions
        </Text>
        <Text variant="caption" color="muted" marginTop={2}>
          {hasAnySubmissions
            ? `${imageSubmissions.length} photos uploaded`
            : "No photos yet. Your group can be first."}
        </Text>
      </YStack>

      {!hasAnySubmissions ? (
        <XStack
          marginHorizontal="$4"
          marginBottom="$3"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.12)"
          borderStyle="dashed"
          borderRadius="$lg"
          padding="$3"
          alignItems="center"
          gap="$2"
        >
          <Ionicons name="images-outline" size={20} color="#475569" />
          <Text variant="caption" color="muted" flex={1}>
            No photos yet. Submit first and set the pace.
          </Text>
        </XStack>
      ) : (
        <YStack paddingHorizontal="$4" paddingBottom="$3" gap="$3">
          {showPodium && (
            <YStack gap="$2">
              <Text
                fontSize={10}
                color="muted"
                textTransform="uppercase"
                letterSpacing={1.1}
                fontWeight="$bold"
              >
                Top 3
              </Text>
              <XStack gap="$2">
                {[1, 2, 3].map((rank) => {
                  const submission = podiumByRank.get(rank);
                  if (!submission) {
                    return (
                      <PodiumPlaceholder key={`podium-${rank}`} rank={rank} />
                    );
                  }

                  return (
                    <SubmissionTile
                      key={`podium-${submission.id}`}
                      submission={submission}
                      mode="podium"
                      rank={rank}
                      onPress={() => openGalleryAt(submission.id)}
                    />
                  );
                })}
              </XStack>
            </YStack>
          )}

          {previewRegularSubmissions.length > 0 && (
            <YStack gap="$2">
              <Text
                fontSize={10}
                color="muted"
                textTransform="uppercase"
                letterSpacing={1.1}
                fontWeight="$bold"
              >
                {showPodium ? "More photos" : "Gallery"}
              </Text>
              <XStack flexDirection="row" flexWrap="wrap" gap="$2">
                {previewRegularSubmissions.map((submission) => (
                  <SubmissionTile
                    key={`preview-${submission.id}`}
                    submission={submission}
                    mode="preview"
                    onPress={() => openGalleryAt(submission.id)}
                  />
                ))}
              </XStack>
            </YStack>
          )}

          <TouchableOpacity onPress={() => openGalleryAt()} activeOpacity={0.8}>
            <XStack
              borderWidth={1}
              borderColor="rgba(0,206,209,0.4)"
              borderRadius="$lg"
              paddingVertical="$2"
              paddingHorizontal="$3"
              alignItems="center"
              justifyContent="center"
              gap="$1"
              backgroundColor="rgba(0,206,209,0.12)"
            >
              <Text fontSize={13} fontWeight="$bold" color="primary">
                View all ({imageSubmissions.length})
              </Text>
              <Ionicons
                name="arrow-forward-circle-outline"
                size={16}
                color="#00ced1"
              />
            </XStack>
          </TouchableOpacity>
        </YStack>
      )}

      <Modal
        visible={isGalleryOpen}
        animationType="slide"
        onRequestClose={closeGallery}
        presentationStyle="fullScreen"
      >
        <YStack flex={1} backgroundColor="#17181c">
          <XStack
            paddingHorizontal="$4"
            paddingTop={insets.top + 8}
            paddingBottom="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="rgba(255,255,255,0.08)"
          >
            <Text variant="h5" color="white" fontWeight="$bold">
              Groups submissions
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text fontSize={13} fontWeight="$bold" color="muted">
                {gallerySubmissions.length > 0
                  ? `${activeGalleryIndex + 1}/${gallerySubmissions.length}`
                  : "0/0"}
              </Text>
              <TouchableOpacity onPress={closeGallery} activeOpacity={0.8}>
                <YStack
                  width={34}
                  height={34}
                  borderRadius={17}
                  borderWidth={1}
                  borderColor="rgba(255,255,255,0.16)"
                  backgroundColor="rgba(255,255,255,0.04)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons name="close" size={20} color="white" />
                </YStack>
              </TouchableOpacity>
            </XStack>
          </XStack>

          <FlatList
            ref={galleryListRef}
            data={gallerySubmissions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleGalleryScrollEnd}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const fallbackIndex = Math.max(
                0,
                Math.min(
                  info.index,
                  Math.max(gallerySubmissions.length - 1, 0),
                ),
              );
              setTimeout(() => {
                galleryListRef.current?.scrollToIndex({
                  index: fallbackIndex,
                  animated: false,
                });
              }, 50);
            }}
            renderItem={({ item }) => (
              <FullscreenSubmissionSlide
                submission={item}
                width={width}
                height={height}
                topInset={insets.top}
              />
            )}
          />
        </YStack>
      </Modal>
    </Card>
  );
}

function PodiumPlaceholder({ rank }: { rank: number }) {
  return (
    <YStack
      flex={1}
      borderWidth={1}
      borderColor="rgba(255,255,255,0.18)"
      borderRadius="$md"
      backgroundColor="#272935"
      padding={6}
      gap={6}
      alignItems="center"
    >
      <YStack
        width="100%"
        aspectRatio={1}
        borderRadius="$sm"
        overflow="hidden"
        borderWidth={1}
        borderColor="rgba(255,255,255,0.1)"
        alignItems="center"
        justifyContent="center"
        backgroundColor="#1b2828"
      >
        <Ionicons name="trophy-outline" size={14} color="#475569" />
      </YStack>
      <Text fontSize={11} fontWeight="$bold" color="muted">
        #{rank}
      </Text>
    </YStack>
  );
}

function SubmissionTile({
  submission,
  mode,
  rank,
  onPress,
}: {
  submission: CommunitySubmission;
  mode: "podium" | "preview";
  rank?: number;
  onPress: () => void;
}) {
  const imagePath = submission.imageIds[0] ?? "";
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!imagePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: imagePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, imagePath, reset]);

  const placeStyle = rank ? placeStyleMap[rank] : undefined;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <YStack
        borderWidth={1}
        borderRadius="$md"
        backgroundColor="#272935"
        overflow="hidden"
        borderColor={placeStyle?.borderColor ?? "rgba(255,255,255,0.16)"}
        flex={mode === "podium" ? 1 : undefined}
        width={mode === "preview" ? "31.5%" : undefined}
        padding={mode === "podium" ? 6 : 4}
        gap={mode === "podium" ? 6 : 0}
      >
        <YStack
          width="100%"
          aspectRatio={1}
          borderRadius="$sm"
          overflow="hidden"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.1)"
          backgroundColor="#1b2828"
        >
          {status === "loading" ? (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <ActivityIndicator size="small" color="#00ced1" />
            </YStack>
          ) : file?.uri ? (
            <Image
              source={{ uri: file.uri }}
              width="100%"
              height="100%"
              resizeMode="contain"
            />
          ) : (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <Ionicons name="image-outline" size={16} color="#475569" />
            </YStack>
          )}
        </YStack>

        {mode === "podium" && (
          <Text
            textAlign="center"
            color="muted"
            fontSize={11}
            fontWeight="$bold"
            numberOfLines={1}
          >
            {placeStyle?.label ?? submission.group.name}
          </Text>
        )}
      </YStack>
    </TouchableOpacity>
  );
}

function FullscreenSubmissionSlide({
  submission,
  width,
  height,
  topInset,
}: {
  submission: CommunitySubmission;
  width: number;
  height: number;
  topInset: number;
}) {
  const imagePath = submission.imageIds[0] ?? "";
  const { download, status, file, reset, abort } = useFileDownload();
  const placeStyle =
    typeof submission.ranking === "number"
      ? placeStyleMap[submission.ranking]
      : undefined;

  useEffect(() => {
    if (!imagePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: imagePath }).catch(() => undefined);

    return () => {
      abort();
    };
  }, [abort, download, imagePath, reset]);

  return (
    <YStack
      width={width}
      minHeight={height - (topInset + 92)}
      paddingHorizontal="$3"
      paddingVertical="$3"
      justifyContent="center"
    >
      <YStack
        flex={1}
        borderRadius="$lg"
        borderWidth={1}
        borderColor="rgba(255,255,255,0.14)"
        overflow="hidden"
        backgroundColor="#090a0d"
        minHeight={300}
      >
        {status === "loading" ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" color="#00ced1" />
          </YStack>
        ) : file?.uri ? (
          <Image
            source={{ uri: file.uri }}
            width="100%"
            height="100%"
            resizeMode="contain"
          />
        ) : (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Ionicons name="image-outline" size={28} color="#475569" />
          </YStack>
        )}
      </YStack>

      <YStack marginTop="$2" gap={2} paddingHorizontal="$1">
        <Text fontSize={14} fontWeight="$bold" color="white" numberOfLines={1}>
          {submission.group.name}
        </Text>
        {placeStyle ? (
          <Text
            fontSize={10}
            fontWeight="$bold"
            textTransform="uppercase"
            letterSpacing={0.6}
            color={placeStyle.borderColor}
          >
            {placeStyle.label}
          </Text>
        ) : null}
        <Text fontSize={10} color="muted">
          {formatDateTime(submission.createdAt)}
        </Text>
      </YStack>
    </YStack>
  );
}
