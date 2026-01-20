import { Image } from "expo-image";
import React from "react";
import Animated, { ZoomIn } from "react-native-reanimated";
import miraiLogo from "../../assets/mirai_logo.png";

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 120 }: LogoProps) {
  return (
    <Animated.View
      entering={ZoomIn.duration(300).springify()}
      style={{ width: size, height: size, overflow: 'hidden' }}
    >
      <Image
        source={miraiLogo}
        style={{ width: size, height: size }}
      />
    </Animated.View>
  );
}
