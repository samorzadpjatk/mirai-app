"use no memo";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View, useWindowDimensions } from "react-native";
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { colors } from "~/styles";
import { type ReviewStatus, useJudgement } from "~/stores/judgement";
import { textStyles, viewStyles } from "~/styles/judgement";
import { QueuedSubmissionCard } from "~/components/judgement/QueuedSubmissionCard";
import { CurrentSubmissionCard } from "~/components/judgement/CurrentSubmissionCard";
import { EmptyStateCard } from "~/components/judgement/EmptyStateCard";
import { ActionBar } from "~/components/judgement/ActionBar";

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

  const runSwipeAnimation = useCallback(
    (toValue: number, onComplete: () => void) => {
      translateX.value = withTiming(toValue, { duration: 220 }, onComplete);
    },
    [translateX],
  );

  const resetCardPosition = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [translateX, translateY]);

  const animateDecision = useCallback(
    (status: ReviewStatus, customRejectionReason?: string, ranking?: 1 | 2 | 3) => {
      if (!currentSubmission || isReviewing) return;
      const normalizedRejectionReason = customRejectionReason?.trim();
      if (status === "REJECTED" && !normalizedRejectionReason) return;
      const toValue = status === "APPROVED" ? width * 1.2 : -width * 1.2;
      runSwipeAnimation(toValue, () => {
        runOnJS(reviewCurrent)(status, normalizedRejectionReason, ranking);
        runOnJS(resetCardPosition)();
      });
    },
    [currentSubmission, isReviewing, reviewCurrent, resetCardPosition, runSwipeAnimation, width],
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
      { text: "3rd place", onPress: () => animateDecision("APPROVED", undefined, 3) },
      { text: "2nd place", onPress: () => animateDecision("APPROVED", undefined, 2) },
      { text: "1st place", onPress: () => animateDecision("APPROVED", undefined, 1) },
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

  const updatePanPosition = useCallback(
    (translationX: number, translationY: number) => {
      translateX.value = translationX;
      translateY.value = translationY * 0.6;
    },
    [translateX, translateY],
  );

  const springBack = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, [translateX, translateY]);

  const animateApproveSwipe = useCallback(
    (targetWidth: number) => {
      translateX.value = withTiming(targetWidth * 1.2, { duration: 220 }, () => {
        runOnJS(reviewCurrent)("APPROVED");
        runOnJS(resetCardPosition)();
      });
    },
    [resetCardPosition, reviewCurrent, translateX],
  );

  const animateRejectSwipe = useCallback(
    (targetWidth: number) => {
      translateX.value = withTiming(-targetWidth * 1.2, { duration: 220 }, () => {
        runOnJS(openRejectModal)();
        runOnJS(resetCardPosition)();
      });
    },
    [openRejectModal, resetCardPosition, translateX],
  );

  const panGesture = Gesture.Pan()
    .enabled(Boolean(currentSubmission) && !isReviewing && !isRejectModalVisible)
    .minDistance(10)
    .onUpdate((event) => {
      updatePanPosition(event.translationX, event.translationY);
    })
    .onEnd(() => {
      const shouldApprove = translateX.value > swipeThreshold;
      const shouldReject = translateX.value < -swipeThreshold;

      if (shouldApprove) {
        if (isJudgedStaff) {
          springBack();
          runOnJS(openApproveSelection)();
          return;
        }
        animateApproveSwipe(width);
      } else if (shouldReject) {
        animateRejectSwipe(width);
      } else {
        springBack();
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(translateX.value, [-width, width], [-8, 8], Extrapolation.CLAMP);
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
      opacity: interpolate(translateX.value, [0, swipeThreshold], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(translateX.value, [0, swipeThreshold], [0.8, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const rejectStampStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(translateX.value, [-swipeThreshold, 0], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(translateX.value, [-swipeThreshold, 0], [1, 0.8], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <>
      <View style={viewStyles.cardStack}>
        {nextSubmission && (
          <QueuedSubmissionCard submission={nextSubmission} maxCardHeight={maxCardHeight} />
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
      </View>

      <ActionBar
        disabled={!currentSubmission || isReviewing || isRejectModalVisible}
        onReject={openRejectModal}
        onApprove={openApproveSelection}
      />

      <Modal
        animationType="fade"
        transparent
        visible={isRejectModalVisible}
        onRequestClose={closeRejectModal}
      >
        <Pressable style={viewStyles.rejectReasonBackdrop} onPress={closeRejectModal}>
          <Pressable
            style={viewStyles.rejectReasonCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={textStyles.rejectReasonTitle}>Reject submission</Text>
            <Text style={textStyles.rejectReasonSubtitle}>Add a short reason for the team.</Text>
            <TextInput
              style={viewStyles.rejectReasonInput}
              placeholder="Why was this rejected?"
              placeholderTextColor={colors.textTertiary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              maxLength={280}
              editable={!isReviewing}
            />
            <View style={viewStyles.rejectReasonActions}>
              <Pressable style={viewStyles.rejectReasonCancelButton} onPress={closeRejectModal}>
                <Text style={textStyles.rejectReasonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  viewStyles.rejectReasonConfirmButton,
                  !canSubmitReject && viewStyles.rejectReasonConfirmButtonDisabled,
                ]}
                onPress={confirmReject}
                disabled={!canSubmitReject}
              >
                <Text style={textStyles.rejectReasonConfirmText}>Reject</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export { CardStack };
