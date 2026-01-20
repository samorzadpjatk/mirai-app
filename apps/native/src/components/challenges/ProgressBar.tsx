import React, { useEffect, useMemo } from 'react';
import { View, Animated } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const animatedWidth = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  return (
    <View className={`w-full h-3 bg-gray-200 dark:bg-surface-dark rounded-full overflow-hidden p-[2px] ${className}`}>
      <Animated.View 
        className="h-full bg-primary rounded-full"
        style={{
          width: animatedWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          }),
          shadowColor: '#00ced1',
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0.5,
          shadowRadius: 4,
        }}
      />
    </View>
  );
}