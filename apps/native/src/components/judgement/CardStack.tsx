"use no memo";

import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Extrapolation, interpolate, runOnJS, useAnimatedStyle } from "react-native-reanimated";
import { ActionBar } from "~/components/judgement/ActionBar";
import { CurrentSubmissionCard } from "~/components/judgement/CurrentSubmissionCard";
import { EmptyStateCard } from "~/components/judgement/EmptyStateCard";
import { QueuedSubmissionCard } from "~/components/judgement/QueuedSubmissionCard";
import { useJudgement } from "~/stores/judgement";
import { colors } from "~/styles";
import { makeJudgementTextStyles, makeJudgementViewStyles } from "~/styles/judgement";
import { useThemedStyles } from "~/theme/TripThemeProvider";
import { useCardAnimations } from "./hooks/useCardAnimations";

interface CardStackProps {
  tripId: string;
  challengeId: string;
}

import { calculateSwipeToValue, canSubmitReject } from "./cardStackUtils";

export { canSubmitReject, calculateSwipeToValue };

const CardStack = ({ tripId, challengeId }: CardStackProps) => {
  const viewStyles = useThemedStyles(makeJudgementViewStyles);
  const textStyles = useThemedStyles(makeJudgementTextStyles);
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

  const {
    translateX,
    translateY,
    springBack,
    animateDecision,
    animateApproveSwipe,
    animateRejectSwipe,
  } = useCardAnimations();

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

  const openApproveSelection = useCallback(() => {
    if (!currentSubmission || isReviewing) return;

    if (!isJudgedStaff) {
      animateDecision("APPROVED", width, isReviewing, Boolean(currentSubmission), reviewCurrent);
      return;
    }

    Alert.alert("Approve submission", "Select podium place", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Without place",
        onPress: () =>
          animateDecision(
            "APPROVED",
            width,
            isReviewing,
            Boolean(currentSubmission),
            reviewCurrent,
          ),
      },
      {
        text: "3rd place",
        onPress: () =>
          animateDecision(
            "APPROVED",
            width,
            isReviewing,
            Boolean(currentSubmission),
            reviewCurrent,
            undefined,
            3,
          ),
      },
      {
        text: "2nd place",
        onPress: () =>
          animateDecision(
            "APPROVED",
            width,
            isReviewing,
            Boolean(currentSubmission),
            reviewCurrent,
            undefined,
            2,
          ),
      },
      {
        text: "1st place",
        onPress: () =>
          animateDecision(
            "APPROVED",
            width,
            isReviewing,
            Boolean(currentSubmission),
            reviewCurrent,
            undefined,
            1,
          ),
      },
    ]);
  }, [animateDecision, currentSubmission, isJudgedStaff, isReviewing, reviewCurrent, width]);

  const canSubmitRejectResult = canSubmitReject(rejectionReason, isReviewing);

  const confirmReject = useCallback(() => {
    const normalizedRejectionReason = rejectionReason.trim();
    if (!normalizedRejectionReason || isReviewing) return;
    setIsRejectModalVisible(false);
    setRejectionReason("");
    animateDecision(
      "REJECTED",
      width,
      isReviewing,
      Boolean(currentSubmission),
      reviewCurrent,
      normalizedRejectionReason,
    );
  }, [animateDecision, currentSubmission, isReviewing, rejectionReason, reviewCurrent, width]);

  const panGesture = Gesture.Pan()
    .enabled(Boolean(currentSubmission) && !isReviewing && !isRejectModalVisible)
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
          springBack();
          runOnJS(openApproveSelection)();
          return;
        }
        animateApproveSwipe(width, reviewCurrent);
      } else if (shouldReject) {
        animateRejectSwipe(width, openRejectModal);
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
        transparent={true}
        visible={isRejectModalVisible}
        onRequestClose={closeRejectModal}
      >
        <Pressable style={viewStyles.rejectReasonBackdrop} onPress={closeRejectModal}>
          <Pressable
            style={viewStyles.rejectReasonCard}
            onPress={(event) => event?.stopPropagation?.()}
          >
            <Text style={textStyles.rejectReasonTitle}>Reject submission</Text>
            <Text style={textStyles.rejectReasonSubtitle}>Add a short reason for the team.</Text>
            <TextInput
              style={viewStyles.rejectReasonInput}
              placeholder="Why was this rejected?"
              placeholderTextColor={colors.textTertiary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline={true}
              numberOfLines={3}
              maxLength={280}
              editable={!isReviewing}
            />
            <View style={viewStyles.rejectReasonActions}>
              <Pressable
                testID="reject-cancel-button"
                style={viewStyles.rejectReasonCancelButton}
                onPress={closeRejectModal}
              >
                <Text style={textStyles.rejectReasonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="reject-confirm-button"
                style={[
                  viewStyles.rejectReasonConfirmButton,
                  !canSubmitRejectResult && viewStyles.rejectReasonConfirmButtonDisabled,
                ]}
                onPress={confirmReject}
                disabled={!canSubmitRejectResult}
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
