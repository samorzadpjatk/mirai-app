import React from 'react';
import { View, type ViewStyle, StyleSheet } from 'react-native';
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

interface SafeAreaTopProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Component that adds safe area padding only at the top (for notch/status bar)
 * Use this for back buttons and top navigation elements
 */
export function SafeAreaTop({ children, style }: SafeAreaTopProps) {
  const insets = useAppSafeAreaInsets();
  const flattenedStyle = StyleSheet.flatten(style);
  const existingPaddingTop = flattenedStyle?.paddingTop ?? 0;

  return (
    <View
      style={[
        style,
        {
          paddingTop: (typeof existingPaddingTop === 'number' ? existingPaddingTop : 0) + insets.top,
        },
      ]}
    >
      {children}
    </View>
  );
}
