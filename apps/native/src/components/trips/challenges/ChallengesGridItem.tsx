import { useCallback, useMemo, useRef, useState } from "react";
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
import type { ChallengeListItem } from "./types";

interface ChallengesGridItemProps {
  challenge: ChallengeListItem;
  onPress: (challenge: ChallengeListItem) => void;
}

export function ChallengesGridItem({
  challenge,
  onPress,
}: ChallengesGridItemProps) {
  const isLocked = challenge.status === "locked";
  const statusMeta = getStatusMeta(challenge.status);
  const submissionTypeMeta = getSubmissionTypeMeta(challenge.submissionType);
  const scoringMeta = getScoringMeta(challenge.scoringCategory);

  const cardBorderColor =
    challenge.status === "to_solve"
      ? "$statusActive"
      : challenge.status === "visible"
        ? "$statusVisible"
        : challenge.status === "submitted"
          ? "$statusVotingPhase"
          : challenge.status === "solved"
            ? "$statusCompleted"
            : "$borderWhite5";

  return (
    <TouchableOpacity
      onPress={() => onPress(challenge)}
      disabled={isLocked}
      activeOpacity={0.8}
    >
      <Card
        bordered
        elevation={
          challenge.status === "to_solve" ||
          challenge.status === "submitted" ||
          challenge.status === "visible" ||
          challenge.status === "solved"
            ? "md"
            : "sm"
        }
        borderWidth={2}
        borderColor={cardBorderColor}
        opacity={isLocked ? 0.6 : 1}
        aspectRatio={1}
        padding="0"
        overflow="hidden"
      >
        {/* Background Image or Color */}
        <YStack
          flex={1}
          backgroundColor={
            !challenge.image
              ? isLocked
                ? "$surfaceDark"
                : `${challenge.iconColor}1f`
              : undefined
          }
        >
          {challenge.image && (
            <Image
              source={{ uri: challenge.image }}
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              resizeMode="cover"
              borderRadius="$lg"
            />
          )}

          {/* Overlay */}
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(10,11,13,0.28)"
          />

          <YStack flex={1} justifyContent="space-between" padding="$2">
            {/* Header */}
            <XStack
              justifyContent="space-between"
              alignItems="flex-start"
              zIndex={1}
            >
              <XStack
                borderWidth={1}
                borderRadius="$sm"
                paddingHorizontal="$1"
                paddingVertical={3}
                flexDirection="row"
                alignItems="center"
                gap={4}
                borderColor={statusMeta.borderColor}
                backgroundColor={statusMeta.backgroundColor}
              >
                {isLocked && (
                  <Ionicons
                    name="lock-closed"
                    size={10}
                    color={statusMeta.textColor}
                  />
                )}
                <Text
                  fontSize={9}
                  fontWeight="$bold"
                  textTransform="uppercase"
                  letterSpacing={1}
                  color={statusMeta.textColor}
                >
                  {statusMeta.label}
                </Text>
              </XStack>

              <YStack alignItems="flex-end">
                {isLocked ? (
                  <Ionicons name="lock-closed" size={16} color="#475569" />
                ) : (
                  <Text
                    backgroundColor="rgba(10, 11, 13, 0.62)"
                    color="white"
                    fontSize={10}
                    fontWeight="$bold"
                    paddingHorizontal="$2"
                    paddingVertical={4}
                    borderRadius="$sm"
                    textTransform="uppercase"
                    letterSpacing={1}
                    borderWidth={1}
                    borderColor="rgba(255,255,255,0.3)"
                  >
                    +{challenge.points} MAX
                  </Text>
                )}
                <XStack
                  marginTop={6}
                  flexDirection="row"
                  alignItems="center"
                  gap={4}
                  paddingHorizontal={6}
                  paddingVertical={2}
                  borderRadius="$full"
                  backgroundColor="rgba(10,11,13,0.5)"
                  borderWidth={1}
                  borderColor="rgba(34,197,94,0.28)"
                >
                  <Ionicons name="people" size={12} color="#22c55e" />
                  <Text fontSize={11} fontWeight="$bold" color="#22c55e">
                    {challenge.participantGroupsCount}
                  </Text>
                </XStack>
              </YStack>
            </XStack>

            {/* Icon (when no image) */}
            {!challenge.image && (
              <YStack
                width={40}
                height={40}
                borderRadius="$md"
                alignItems="center"
                justifyContent="center"
                alignSelf="flex-start"
                backgroundColor="rgba(10,11,13,0.58)"
                borderWidth={1}
                borderColor="rgba(255,255,255,0.2)"
                zIndex={1}
              >
                <Ionicons
                  name={challenge.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={isLocked ? "#475569" : challenge.iconColor}
                />
              </YStack>
            )}

            {/* Content */}
            <YStack
              alignSelf="stretch"
              backgroundColor="rgba(10,11,13,0.62)"
              borderWidth={1}
              borderColor="rgba(255,255,255,0.16)"
              borderRadius="$md"
              paddingHorizontal="$2"
              paddingVertical="$2"
            >
              <XStack
                flexDirection="row"
                flexWrap="wrap"
                gap={4}
                marginBottom="$1"
              >
                <XStack
                  flexDirection="row"
                  alignItems="center"
                  gap={4}
                  borderRadius="$full"
                  borderWidth={1}
                  borderColor="rgba(255,255,255,0.16)"
                  backgroundColor="rgba(255,255,255,0.05)"
                  paddingHorizontal={6}
                  paddingVertical={2}
                >
                  <Ionicons
                    name={
                      submissionTypeMeta.icon as keyof typeof Ionicons.glyphMap
                    }
                    size={11}
                    color="#cbd5e1"
                  />
                  <Text
                    fontSize={8}
                    fontWeight="$bold"
                    letterSpacing={0.6}
                    textTransform="uppercase"
                    color="#cbd5e1"
                  >
                    {submissionTypeMeta.label}
                  </Text>
                </XStack>
                <XStack
                  flexDirection="row"
                  alignItems="center"
                  gap={4}
                  borderRadius="$full"
                  borderWidth={1}
                  borderColor="rgba(255,255,255,0.16)"
                  backgroundColor="rgba(255,255,255,0.05)"
                  paddingHorizontal={6}
                  paddingVertical={2}
                >
                  <Ionicons
                    name={scoringMeta.icon as keyof typeof Ionicons.glyphMap}
                    size={11}
                    color="#cbd5e1"
                  />
                  <Text
                    fontSize={8}
                    fontWeight="$bold"
                    letterSpacing={0.6}
                    textTransform="uppercase"
                    color="#cbd5e1"
                  >
                    {scoringMeta.label}
                  </Text>
                </XStack>
              </XStack>
              <Text
                fontSize={13}
                fontWeight="$bold"
                color="white"
                lineHeight={18}
                numberOfLines={2}
              >
                {challenge.title}
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </Card>
    </TouchableOpacity>
  );
}

const getStatusMeta = (status: ChallengeListItem["status"]) => {
  switch (status) {
    case "solved":
      return {
        label: "Solved",
        textColor: "#22c55e",
        borderColor: "rgba(34, 197, 94, 0.45)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
      };
    case "submitted":
      return {
        label: "Submitted",
        textColor: "#f59e0b",
        borderColor: "rgba(245, 158, 11, 0.45)",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
      };
    case "rejected":
      return {
        label: "Rejected",
        textColor: "#ef4444",
        borderColor: "rgba(239, 68, 68, 0.45)",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
      };
    case "completed":
      return {
        label: "Completed",
        textColor: "#22c55e",
        borderColor: "rgba(34, 197, 94, 0.45)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
      };
    case "locked":
      return {
        label: "Locked",
        textColor: "#64748b",
        borderColor: "rgba(100, 116, 139, 0.45)",
        backgroundColor: "rgba(100, 116, 139, 0.2)",
      };
    case "to_solve":
      return {
        label: "Active",
        textColor: "#22c55e",
        borderColor: "rgba(34, 197, 94, 0.45)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
      };
    case "visible":
      return {
        label: "Visible",
        textColor: "#0ea5e9",
        borderColor: "rgba(14, 165, 233, 0.45)",
        backgroundColor: "rgba(14, 165, 233, 0.2)",
      };
    default:
      return {
        label: "Active",
        textColor: "#00ced1",
        borderColor: "rgba(0, 206, 209, 0.45)",
        backgroundColor: "rgba(0, 206, 209, 0.2)",
      };
  }
};

const getSubmissionTypeMeta = (
  submissionType: ChallengeListItem["submissionType"],
) => {
  switch (submissionType) {
    case "MULTI_IMAGE":
      return { label: "Multi", icon: "images-outline" };
    case "VIDEO":
      return { label: "Video", icon: "videocam-outline" };
    case "TEXT":
      return { label: "Text", icon: "document-text-outline" };
    case "IMAGE_LOCATION":
      return { label: "Photo+GPS", icon: "camera-outline" };
    case "LOCATION":
      return { label: "GPS", icon: "location-outline" };
    case "QR_CODE":
      return { label: "QR", icon: "qr-code-outline" };
    case "IMAGE":
    default:
      return { label: "Photo", icon: "image-outline" };
  }
};

const getScoringMeta = (
  scoringCategory: ChallengeListItem["scoringCategory"],
) => {
  switch (scoringCategory) {
    case "SPEED":
      return { label: "Speed", icon: "flash-outline" };
    case "UNLIMITED":
      return { label: "Unlimited", icon: "infinite-outline" };
    case "PEER_VOTING":
      return { label: "Voting", icon: "people-outline" };
    case "JUDGED_STAFF":
      return { label: "Staff", icon: "shield-checkmark-outline" };
    default:
      return { label: "Scoring", icon: "stats-chart-outline" };
  }
};
