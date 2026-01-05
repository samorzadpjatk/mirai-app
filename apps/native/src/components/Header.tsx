import { YStack, XStack, H1, Text } from "tamagui";
import { User } from "@tamagui/lucide-icons";
import React from "react";
import Logo from "./Logo";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showUserEmail?: boolean;
  userEmail?: string;
}

export default function Header({
  title,
  subtitle,
  showUserEmail = false,
  userEmail,
}: HeaderProps) {
  return (
    <YStack space="$4" items="center">
      <Logo size={120} />
      <YStack space="$2" items="center">
        <H1
          fontSize="$11"
          fontWeight="900"
          text="center"
          letterSpacing={-1}
          animation="quick"
          enterStyle={{ y: -20, opacity: 0 }}
          y={0}
          opacity={1}
        >
          {title}
        </H1>
        {showUserEmail && userEmail && (
          <XStack space="$2" items="center">
            <User size={16} />
            <Text
              fontSize="$4"
              fontWeight="600"
              opacity={0.8}
            >
              {userEmail}
            </Text>
          </XStack>
        )}
        {subtitle && (
          <Text fontSize="$3" opacity={0.7}>
            {subtitle}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}
