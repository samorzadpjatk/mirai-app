import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progress, { duration: 1000 });
  }, [progress, animatedWidth]);

  const widthStyle = useAnimatedStyle(() => ({
    width: `${interpolate(animatedWidth.value, [0, 100], [0, 100])}%`,
  }));

  return (
    <View
      className={`w-full h-3 bg-gray-200 dark:bg-surface-dark rounded-full overflow-hidden p-[2px] ${className}`}
    >
      <Animated.View
        className="h-full bg-primary rounded-full"
        style={[
          widthStyle,
          {
            shadowColor: "#00ced1",
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          },
        ]}
      />
    </View>
  );
}
