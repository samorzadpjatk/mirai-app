import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, useWindowDimensions } from "react-native";
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { YStack, XStack, Input, Sheet } from "tamagui";
import { type ReviewStatus, useJudgement } from "~/stores/judgement";
import { QueuedSubmissionCard } from "~/components/judgement/QueuedSubmissionCard";
import { CurrentSubmissionCard } from "~/components/judgement/CurrentSubmissionCard";
import { EmptyStateCard } from "~/components/judgement/EmptyStateCard";
import { ActionBar } from "~/components/judgement/ActionBar";
import { Text, Button, colorTokens } from "@mirai-app/ui";

interface CardStackProps {
  tripId: string;
  challengeId: string;
}

const CardStack = ({ tripId, challengeId }: CardStackProps) => {
  const {
    currentSubmission,
    nextSubmission,
    reviewCurrent,
    isReviewing,
    challengeScoringCategory,
  } = useJudgement(tripId, challengeId);
  const { width, height } = useWindowDimensions();
  const swipeThreshold = width * 0.25;
  const maxCardHeight = Math.min(560, height * 0.64);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const isJudgedStaff = challengeScoringCategory === "JUDGED_STAFF";

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    setIsRejectModalVisible(false);
    setRejectionReason("");
  }, [currentSubmission, translateX, translateY]);

  const openRejectModal = useCallback(() => {
    if (!currentSubmission || isReviewing) return;
    setIsRejectModalVisible(true);
  }, [currentSubmission, isReviewing]);

  const closeRejectModal = useCallback(() => {
    if (isReviewing) return;
    setIsRejectModalVisible(false);
    setRejectionReason("");
  }, [isReviewing]);

  const animateDecision = useCallback(
    (
      status: ReviewStatus,
      customRejectionReason?: string,
      ranking?: 1 | 2 | 3,
    ) => {
      if (!currentSubmission || isReviewing) return;
      const normalizedRejectionReason = customRejectionReason?.trim();
      if (status === "REJECTED" && !normalizedRejectionReason) return;
      const toValue = status === "APPROVED" ? width * 1.2 : -width * 1.2;
      translateX.value = withTiming(toValue, { duration: 220 }, () => {
        scheduleOnRN(reviewCurrent, status, normalizedRejectionReason, ranking);
        translateX.value = 0;
        translateY.value = 0;
      });
    },
    [
      currentSubmission,
      isReviewing,
      reviewCurrent,
      translateX,
      translateY,
      width,
    ],
  );

  const openApproveSelection = useCallback(() => {
    if (!currentSubmission || isReviewing) return;

    if (!isJudgedStaff) {
      animateDecision("APPROVED");
      return;
    }

    Alert.alert("Approve submission", "Select podium place", [
      { text: "Cancel", style: "cancel" },
      { text: "Without place", onPress: () => animateDecision("APPROVED") },
      {
        text: "3rd place",
        onPress: () => animateDecision("APPROVED", undefined, 3),
      },
      {
        text: "2nd place",
        onPress: () => animateDecision("APPROVED", undefined, 2),
      },
      {
        text: "1st place",
        onPress: () => animateDecision("APPROVED", undefined, 1),
      },
    ]);
  }, [animateDecision, currentSubmission, isJudgedStaff, isReviewing]);

  const canSubmitReject = useMemo(
    () => rejectionReason.trim().length > 0 && !isReviewing,
    [rejectionReason, isReviewing],
  );

  const confirmReject = useCallback(() => {
    const normalizedRejectionReason = rejectionReason.trim();
    if (!normalizedRejectionReason || isReviewing) return;
    setIsRejectModalVisible(false);
    setRejectionReason("");
    animateDecision("REJECTED", normalizedRejectionReason);
  }, [animateDecision, isReviewing, rejectionReason]);

  const panGesture = Gesture.Pan()
    .enabled(
      Boolean(currentSubmission) && !isReviewing && !isRejectModalVisible,
    )
    .minDistance(10)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.6;
    })
    .onEnd(() => {
      const shouldApprove = translateX.value > swipeThreshold;
      const shouldReject = translateX.value < -swipeThreshold;

      if (shouldApprove) {
        if (isJudgedStaff) {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          scheduleOnRN(openApproveSelection);
          return;
        }

        translateX.value = withTiming(width * 1.2, { duration: 220 }, () => {
          scheduleOnRN(reviewCurrent, "APPROVED");
          translateX.value = 0;
          translateY.value = 0;
        });
        return;
      }

      if (shouldReject) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scheduleOnRN(openRejectModal);
        return;
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-width, width],
      [-8, 8],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const approveStampStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateX.value,
        [0, swipeThreshold],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            translateX.value,
            [0, swipeThreshold],
            [0.8, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const rejectStampStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateX.value,
        [-swipeThreshold, 0],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            translateX.value,
            [-swipeThreshold, 0],
            [1, 0.8],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <>
      <YStack flex={1} position="relative">
        {nextSubmission && (
          <QueuedSubmissionCard
            submission={nextSubmission}
            maxCardHeight={maxCardHeight}
          />
        )}

        {currentSubmission ? (
          <GestureDetector gesture={panGesture}>
            <CurrentSubmissionCard
              submission={currentSubmission}
              maxCardHeight={maxCardHeight}
              cardStyle={cardStyle}
              approveStampStyle={approveStampStyle}
              rejectStampStyle={rejectStampStyle}
            />
          </GestureDetector>
        ) : (
          <EmptyStateCard maxCardHeight={maxCardHeight} />
        )}
      </YStack>

      <ActionBar
        disabled={!currentSubmission || isReviewing || isRejectModalVisible}
        onReject={openRejectModal}
        onApprove={openApproveSelection}
      />

      <Sheet
        open={isRejectModalVisible}
        onOpenChange={setIsRejectModalVisible}
        title="Reject submission"
      >
        <YStack gap="$md">
          <Text variant="bodySmall" color="muted">
            Add a short reason for the team.
          </Text>
          <Input
            placeholder="Why was this rejected?"
            placeholderTextColor={colorTokens.textTertiary}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={3}
            maxLength={280}
            editable={!isReviewing}
            backgroundColor={colorTokens.backgroundDark}
            borderRadius="$md"
            padding="$md"
            color={colorTokens.textPrimary}
            borderWidth={1}
            borderColor={colorTokens.borderWhite5}
            minHeight={100}
            textAlignVertical="top"
          />
          <XStack gap="$md" marginTop="$md">
            <Button flex={1} variant="secondary" onPress={closeRejectModal}>
              Cancel
            </Button>
            <Button
              flex={1}
              variant="danger"
              onPress={confirmReject}
              disabled={!canSubmitReject}
              opacity={canSubmitReject ? 1 : 0.5}
            >
              Reject
            </Button>
          </XStack>
        </YStack>
      </Sheet>
    </>
  );
};

export { CardStack };
