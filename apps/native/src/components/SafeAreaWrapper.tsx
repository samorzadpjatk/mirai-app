import React from "react";
import { View, type ViewStyle, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeAreaTopProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Component that adds safe area padding only at the top (for notch/status bar)
 * Use this for back buttons and top navigation elements
 */
export function SafeAreaTop({ children, style }: SafeAreaTopProps) {
  const insets = useSafeAreaInsets();
  const flattenedStyle = StyleSheet.flatten(style);
  const existingPaddingTop = flattenedStyle?.paddingTop ?? 0;

  return (
    <View
      testID="safe-area-top"
      style={[
        style,
        {
          paddingTop:
            (typeof existingPaddingTop === "number" ? existingPaddingTop : 0) + insets.top,
        },
      ]}
    >
      {children}
    </View>
  );
}
