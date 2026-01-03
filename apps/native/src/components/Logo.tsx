import { View } from "tamagui";
import { Image } from "expo-image";
import React from "react";
import miraiLogo from "../../assets/mirai_logo.png";

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 120 }: LogoProps) {
  return (
    <View
      width={size}
      height={size}
      overflow="hidden"
      animation="quick"
      enterStyle={{ scale: 0, opacity: 0 }}
      scale={1}
      opacity={1}
    >
      <Image
        source={miraiLogo}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
