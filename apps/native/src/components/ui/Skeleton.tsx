import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useEffect, useMemo } from "react";
import { type DimensionValue, View, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { borderRadius, colors, spacing, typography } from "~/styles";

const DURATION_MS = 1500;
const GRADIENT_WIDTH_RATIO = 0.75;

type SkeletonVariant = "box" | "circle" | "line" | "text";

interface SkeletonColors {
  base: string;
  highlight: string;
}

interface SkeletonProps {
  variant?: SkeletonVariant;
  width: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  colors?: SkeletonColors;
  testID?: string;
}

interface SkeletonLineProps extends Omit<SkeletonProps, "variant" | "height"> {
  count?: number;
  gap?: number;
  height?: DimensionValue;
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  gap?: number;
}

interface SkeletonGroupContextValue {
  progress: SharedValue<number>;
}

const SkeletonGroupContext = React.createContext<SkeletonGroupContextValue | null>(null);

function resolveBorderRadius(
  variant: SkeletonVariant,
  width: DimensionValue,
  override?: number,
): number {
  if (override !== undefined) {
    return override;
  }

  if (variant === "circle") {
    return typeof width === "number" ? width / 2 : borderRadius.full;
  }

  if (variant === "box") {
    return borderRadius.md;
  }

  return borderRadius.sm;
}

function resolveHeight(variant: SkeletonVariant, height?: DimensionValue): DimensionValue {
  if (height !== undefined) {
    return height;
  }

  if (variant === "line" || variant === "text") {
    return typography.base;
  }

  return 0;
}

function useSkeletonGroupProgress(): SharedValue<number> | null {
  return useContext(SkeletonGroupContext)?.progress ?? null;
}

function SkeletonBase({
  variant = "box",
  width,
  height,
  borderRadius: borderRadiusOverride,
  style,
  colors: colorOverrides,
  testID,
}: SkeletonProps) {
  const groupProgress = useSkeletonGroupProgress();
  const ownProgress = useSharedValue(0);
  const progress = groupProgress ?? ownProgress;
  const containerWidth = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const resolvedBase = colorOverrides?.base ?? colors.surfaceDark;
  const resolvedBorderRadius = resolveBorderRadius(variant, width, borderRadiusOverride);
  const resolvedHeight = resolveHeight(variant, height);

  useEffect(() => {
    if (reducedMotion || groupProgress) {
      return;
    }

    progress.value = withRepeat(
      withTiming(1, {
        duration: DURATION_MS,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(ownProgress);
    };
  }, [groupProgress, ownProgress, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const containerW = containerWidth.value || (typeof width === "number" ? width : 0);
    const gradientW = containerW * GRADIENT_WIDTH_RATIO || 1;
    const translateX = -gradientW + progress.value * (containerW + gradientW * 2);

    return {
      transform: [{ translateX }],
      width: gradientW,
      height: "100%",
    };
  });

  const handleLayout = ({ nativeEvent }: { nativeEvent: { layout: { width: number } } }) => {
    containerWidth.value = nativeEvent.layout.width;
  };

  const rootTestID = testID ?? "skeleton";

  if (reducedMotion) {
    return (
      <View
        testID={`${rootTestID}-static`}
        style={[
          {
            width,
            height: resolvedHeight,
            borderRadius: resolvedBorderRadius,
            backgroundColor: resolvedBase,
            overflow: "hidden",
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      testID={rootTestID}
      onLayout={handleLayout}
      style={[
        {
          width,
          height: resolvedHeight,
          borderRadius: resolvedBorderRadius,
          backgroundColor: resolvedBase,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        testID={`${rootTestID}-shimmer`}
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={["transparent", colors.whiteOpacity15, "transparent"]}
          end={{ x: 1, y: 0.5 }}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          style={{ height: "100%", width: "100%" }}
          testID={`${rootTestID}-gradient`}
        />
      </Animated.View>
    </View>
  );
}

const Skeleton = Object.assign(React.memo(SkeletonBase), {
  Line: React.memo<SkeletonLineProps>(function SkeletonLine({
    count = 3,
    gap = spacing.sm,
    width,
    height = typography.base,
    colors: colorOverrides,
    style,
    testID,
  }) {
    const rootTestID = testID ?? "skeleton-line";

    return (
      <View style={[{ gap }, style]} testID={rootTestID}>
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonBase
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are deterministic placeholders with no stable id
            key={`${rootTestID}-row-${index}`}
            colors={colorOverrides}
            height={height}
            testID={`${rootTestID}-${index}`}
            variant="line"
            width={width}
          />
        ))}
      </View>
    );
  }),

  Group: React.memo<SkeletonGroupProps>(function SkeletonGroup({
    children,
    gap = spacing.sm,
    style,
    testID,
  }) {
    const progress = useSharedValue(0);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
      if (reducedMotion) {
        return;
      }

      progress.value = withRepeat(
        withTiming(1, {
          duration: DURATION_MS,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        true,
      );

      return () => {
        cancelAnimation(progress);
      };
    }, [progress, reducedMotion]);

    const contextValue = useMemo(() => ({ progress }), [progress]);

    return (
      <View style={[{ gap }, style]} testID={testID ?? "skeleton-group"}>
        <SkeletonGroupContext.Provider value={contextValue}>
          {children}
        </SkeletonGroupContext.Provider>
      </View>
    );
  }),
});

export { Skeleton };
export default Skeleton;
