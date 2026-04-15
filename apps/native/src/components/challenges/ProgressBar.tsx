import { YStack, styled } from "@mirai-app/ui";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
}

const StyledProgressTrack = styled(YStack, {
  width: "100%",
  height: 12,
  backgroundColor: "$borderWhite10",
  borderRadius: "$full",
  overflow: "hidden",
  padding: 2,
});

const AnimatedView = Animated.createAnimatedComponent(View);

export function ProgressBar({ progress, height = 12 }: ProgressBarProps) {
  const animatedWidth = useSharedValue(0);

  // Update animated value when progress changes
  animatedWidth.value = withTiming(progress, { duration: 1000 });

  const widthStyle = useAnimatedStyle(() => ({
    width: `${interpolate(animatedWidth.value, [0, 100], [0, 100])}%`,
  }));

  return (
    <StyledProgressTrack height={height}>
      <AnimatedView
        style={[
          widthStyle,
          {
            height: "100%",
            backgroundColor: "#00ced1",
            borderRadius: 999,
            shadowColor: "#00ced1",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          },
        ]}
      />
    </StyledProgressTrack>
  );
}
