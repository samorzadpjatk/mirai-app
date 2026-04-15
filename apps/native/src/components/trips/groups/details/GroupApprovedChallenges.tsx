import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { useTheme } from "tamagui";

interface ApprovedSubmissionItem {
  submissionId: string;
  challengeId: string;
  challengeTitle: string;
  imageStoragePath: string;
  approvedAt: string | Date;
}

interface GroupApprovedChallengesProps {
  submissions: ApprovedSubmissionItem[];
}

export function GroupApprovedChallenges({
  submissions,
}: GroupApprovedChallengesProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<ApprovedSubmissionItem>>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openFullscreen = useCallback(
    (index: number) => {
      if (!submissions.length) return;
      setActiveIndex(index);
      setIsFullscreenOpen(true);
    },
    [submissions.length],
  );

  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
  }, []);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / Math.max(width, 1));
      const boundedIndex = Math.max(
        0,
        Math.min(nextIndex, submissions.length - 1),
      );
      setActiveIndex(boundedIndex);
    },
    [submissions.length, width],
  );

  useEffect(() => {
    if (submissions.length === 0) {
      setTimeout(() => setIsFullscreenOpen(false), 0);
      return;
    }
    if (!isFullscreenOpen) return;
    const boundedIndex = Math.max(
      0,
      Math.min(activeIndex, submissions.length - 1),
    );
    const timeout = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: boundedIndex, animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [isFullscreenOpen, activeIndex, submissions.length]);

  if (submissions.length === 0) {
    return null;
  }

  return (
    <YStack marginBottom="$6">
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$3"
        gap="$2"
      >
        <Text
          fontSize="$sm"
          fontWeight="bold"
          color="$colorMuted"
          textTransform="uppercase"
          letterSpacing={1.1}
        >
          Challenge Photos
        </Text>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: "rgba(0,206,209,0.38)",
            backgroundColor: "rgba(0,206,209,0.12)",
            borderRadius: 9999,
            paddingHorizontal: 8,
            paddingVertical: 6,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
          onPress={() => openFullscreen(0)}
          activeOpacity={0.8}
        >
          <Text
            color="rgba(0, 206, 209, 1)"
            fontSize={11}
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing={0.6}
          >
            View all
          </Text>
          <Ionicons
            name="expand-outline"
            size={14}
            color="rgba(0, 206, 209, 1)"
          />
        </TouchableOpacity>
      </XStack>

      <XStack flexWrap="wrap" gap="$3">
        {submissions.map((submission, index) => (
          <SubmissionCircle
            key={submission.submissionId}
            submission={submission}
            onPress={() => openFullscreen(index)}
          />
        ))}
      </XStack>

      <Modal
        visible={isFullscreenOpen}
        animationType="slide"
        onRequestClose={closeFullscreen}
        presentationStyle="fullScreen"
      >
        <YStack flex={1} backgroundColor="#17181c">
          <XStack
            paddingHorizontal="$3"
            paddingBottom="$2"
            paddingTop={insets.top + 8}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="rgba(255,255,255,0.08)"
          >
            <Text fontSize="$base" fontWeight="bold" color="white">
              Challenge Photos
            </Text>
            <XStack alignItems="center" gap="$2">
              <Text
                fontSize="$xs"
                fontWeight="bold"
                color="rgba(148, 163, 184, 1)"
              >
                {`${activeIndex + 1}/${submissions.length}`}
              </Text>
              <TouchableOpacity
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.16)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
                onPress={closeFullscreen}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </XStack>
          </XStack>

          <FlatList
            ref={listRef}
            data={submissions}
            keyExtractor={(item) => item.submissionId}
            contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const fallbackIndex = Math.max(
                0,
                Math.min(info.index, Math.max(submissions.length - 1, 0)),
              );
              setTimeout(() => {
                listRef.current?.scrollToIndex({
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
    </YStack>
  );
}

function SubmissionCircle({
  submission,
  onPress,
}: {
  submission: ApprovedSubmissionItem;
  onPress: () => void;
}) {
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!submission.imageStoragePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageStoragePath }).catch(
      () => undefined,
    );

    return () => {
      abort();
    };
  }, [abort, download, reset, submission.imageStoragePath]);

  return (
    <TouchableOpacity
      style={{ width: "22%", alignItems: "center", gap: 4 }}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <YStack
        width={72}
        height={72}
        borderRadius="$full"
        overflow="hidden"
        borderWidth={1}
        borderColor="rgba(255, 255, 255, 0.14)"
        backgroundColor="rgba(255, 255, 255, 0.04)"
      >
        {status === "loading" ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="small" color="rgba(0, 206, 209, 1)" />
          </YStack>
        ) : file?.uri ? (
          <Image
            source={{ uri: file.uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Ionicons
              name="image-outline"
              size={18}
              color="rgba(148, 163, 184, 1)"
            />
          </YStack>
        )}
      </YStack>
      <Text
        fontSize={11}
        color="white"
        textAlign="center"
        fontWeight="500"
        lineHeight={14}
        numberOfLines={2}
      >
        {submission.challengeTitle}
      </Text>
    </TouchableOpacity>
  );
}

function FullscreenSubmissionSlide({
  submission,
  width,
  height,
  topInset,
}: {
  submission: ApprovedSubmissionItem;
  width: number;
  height: number;
  topInset: number;
}) {
  const { download, status, file, reset, abort } = useFileDownload();

  useEffect(() => {
    if (!submission.imageStoragePath) {
      reset();
      return;
    }

    reset();
    void download({ storagePath: submission.imageStoragePath }).catch(
      () => undefined,
    );

    return () => {
      abort();
    };
  }, [abort, download, reset, submission.imageStoragePath]);

  return (
    <YStack
      width={width}
      minHeight={height - (topInset + 92)}
      paddingHorizontal="$3"
      paddingVertical="$3"
      justifyContent="center"
    >
      <YStack
        width="100%"
        aspectRatio={4 / 3}
        borderRadius="$lg"
        borderWidth={1}
        borderColor="rgba(255,255,255,0.12)"
        overflow="hidden"
        backgroundColor="rgba(39, 41, 53, 1)"
      >
        {status === "loading" ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" color="rgba(0, 206, 209, 1)" />
          </YStack>
        ) : file?.uri ? (
          <Image
            source={{ uri: file.uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        ) : (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Ionicons
              name="image-outline"
              size={28}
              color="rgba(148, 163, 184, 1)"
            />
          </YStack>
        )}
      </YStack>

      <YStack marginTop="$2" gap={2}>
        <Text fontSize="$sm" fontWeight="bold" color="white" numberOfLines={1}>
          {submission.challengeTitle}
        </Text>
        <Text fontSize="$xs" color="rgba(148, 163, 184, 1)">
          {formatDateTime(submission.approvedAt)}
        </Text>
      </YStack>
    </YStack>
  );
}

const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};
