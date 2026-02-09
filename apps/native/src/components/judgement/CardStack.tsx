import { useCallback, useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { type ReviewStatus, useJudgement } from '~/contexts/judgement';
import { viewStyles } from '~/styles/judgement';
import { QueuedSubmissionCard } from '~/components/judgement/QueuedSubmissionCard';
import { CurrentSubmissionCard } from '~/components/judgement/CurrentSubmissionCard';
import { EmptyStateCard } from '~/components/judgement/EmptyStateCard';
import { ActionBar } from '~/components/judgement/ActionBar';

const CardStack = () => {
  const { currentSubmission, nextSubmission, reviewCurrent, isReviewing } = useJudgement();
  const { width, height } = useWindowDimensions();
  const swipeThreshold = width * 0.25;
  const maxCardHeight = Math.min(560, height * 0.64);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [currentSubmission, translateX, translateY]);

  const animateDecision = useCallback(
    (status: ReviewStatus) => {
      if (!currentSubmission || isReviewing) return;
      const toValue = status === 'APPROVED' ? width * 1.2 : -width * 1.2;
      translateX.value = withTiming(toValue, { duration: 220 }, () => {
        scheduleOnRN(reviewCurrent, status);
        translateX.value = 0;
        translateY.value = 0;
      });
    },
    [currentSubmission, isReviewing, reviewCurrent, translateX, translateY, width],
  );

  const panGesture = Gesture.Pan()
    .enabled(Boolean(currentSubmission) && !isReviewing)
    .minDistance(10)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.6;
    })
    .onEnd(() => {
      const shouldApprove = translateX.value > swipeThreshold;
      const shouldReject = translateX.value < -swipeThreshold;

      if (shouldApprove) {
        translateX.value = withTiming(width * 1.2, { duration: 220 }, () => {
          scheduleOnRN(reviewCurrent, 'APPROVED');
          translateX.value = 0;
          translateY.value = 0;
        });
        return;
      }

      if (shouldReject) {
        translateX.value = withTiming(-width * 1.2, { duration: 220 }, () => {
          scheduleOnRN(reviewCurrent, 'REJECTED');
          translateX.value = 0;
          translateY.value = 0;
        });
        return;
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
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
        { scale: interpolate(translateX.value, [0, swipeThreshold], [0.8, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  const rejectStampStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(translateX.value, [-swipeThreshold, 0], [1, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(translateX.value, [-swipeThreshold, 0], [1, 0.8], Extrapolation.CLAMP) },
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
        disabled={!currentSubmission || isReviewing}
        onReject={() => animateDecision('REJECTED')}
        onApprove={() => animateDecision('APPROVED')}
      />
    </>
  );
};

export { CardStack };
