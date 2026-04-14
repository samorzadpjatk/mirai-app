import React from "react";
import { YStack } from "@mirai-app/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeAreaTopProps {
  children: React.ReactNode;
  style?: object;
  gap?: number;
  px?: number;
  py?: number;
  bg?: string;
}

/**
 * Component that adds safe area padding only at the top (for notch/status bar)
 * Use this for back buttons and top navigation elements
 */
export function SafeAreaTop({
  children,
  style,
  gap,
  px,
  py,
  bg,
}: SafeAreaTopProps) {
  const insets = useSafeAreaInsets();

  return (
    <YStack
      style={[style, { backgroundColor: bg }]}
      gap={gap}
      paddingHorizontal={px}
      paddingVertical={py}
      paddingTop={insets.top}
    >
      {children}
    </YStack>
  );
}

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: object;
  gap?: number;
  px?: number;
  py?: number;
  bg?: string;
}

/**
 * Full screen wrapper with safe area insets applied to all edges
 * Use this for screen-level components
 */
export function SafeAreaWrapper({
  children,
  style,
  gap,
  px,
  py,
  bg,
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <YStack
      flex={1}
      style={[style, { backgroundColor: bg }]}
      gap={gap}
      paddingHorizontal={px}
      paddingVertical={py}
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingLeft={insets.left}
      paddingRight={insets.right}
    >
      {children}
    </YStack>
  );
}

export default SafeAreaWrapper;
