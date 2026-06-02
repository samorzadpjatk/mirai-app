import { useCallback } from "react";
import { runOnJS, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import type { ReviewStatus } from "~/stores/judgement";
import { calculateSwipeToValue } from "../cardStackUtils";

export interface CardAnimationState {
  translateX: ReturnType<typeof useSharedValue<number>>;
  translateY: ReturnType<typeof useSharedValue<number>>;
  runSwipeAnimation: (toValue: number, onComplete: () => void) => void;
  resetCardPosition: () => void;
  updatePanPosition: (translationX: number, translationY: number) => void;
  springBack: () => void;
  animateDecision: (
    status: ReviewStatus,
    width: number,
    isReviewing: boolean,
    hasCurrentSubmission: boolean,
    reviewCurrent: (
      status: ReviewStatus,
      reason?: string,
      ranking?: 1 | 2 | 3,
    ) => void,
    customRejectionReason?: string,
    ranking?: 1 | 2 | 3,
  ) => void;
  animateApproveSwipe: (
    targetWidth: number,
    reviewCurrent: (status: ReviewStatus) => void,
  ) => void;
  animateRejectSwipe: (
    targetWidth: number,
    openRejectModal: () => void,
  ) => void;
}

export function useCardAnimations(): CardAnimationState {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

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

  const animateDecision = useCallback(
    (
      status: ReviewStatus,
      width: number,
      isReviewing: boolean,
      hasCurrentSubmission: boolean,
      reviewCurrent: (
        status: ReviewStatus,
        reason?: string,
        ranking?: 1 | 2 | 3,
      ) => void,
      customRejectionReason?: string,
      ranking?: 1 | 2 | 3,
    ) => {
      if (!hasCurrentSubmission || isReviewing) return;
      const normalizedRejectionReason = customRejectionReason?.trim();
      if (status === "REJECTED" && !normalizedRejectionReason) return;
      const toValue = calculateSwipeToValue(status, width);
      translateX.value = withTiming(toValue, { duration: 220 }, () => {
        runOnJS(reviewCurrent)(status, normalizedRejectionReason, ranking);
        runOnJS(resetCardPosition)();
      });
    },
    [translateX, resetCardPosition],
  );

  const animateApproveSwipe = useCallback(
    (targetWidth: number, reviewCurrent: (status: ReviewStatus) => void) => {
      translateX.value = withTiming(targetWidth * 1.2, { duration: 220 }, () => {
        runOnJS(reviewCurrent)("APPROVED");
        runOnJS(resetCardPosition)();
      });
    },
    [translateX, resetCardPosition],
  );

  const animateRejectSwipe = useCallback(
    (targetWidth: number, openRejectModal: () => void) => {
      translateX.value = withTiming(-targetWidth * 1.2, { duration: 220 }, () => {
        runOnJS(openRejectModal)();
        runOnJS(resetCardPosition)();
      });
    },
    [translateX, resetCardPosition],
  );

  return {
    translateX,
    translateY,
    runSwipeAnimation,
    resetCardPosition,
    updatePanPosition,
    springBack,
    animateDecision,
    animateApproveSwipe,
    animateRejectSwipe,
  };
}
