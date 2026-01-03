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
    <YStack space="$4" alignItems="center">
      <Logo size={120} />
      <YStack space="$2" alignItems="center">
        <H1
          color="$color"
          fontSize="$11"
          fontWeight="900"
          textAlign="center"
          letterSpacing={-1}
          animation="quick"
          enterStyle={{ y: -20, opacity: 0 }}
          y={0}
          opacity={1}
        >
          {title}
        </H1>
        {showUserEmail && userEmail && (
          <XStack space="$2" alignItems="center">
            <User size={16} color="$gray11" />
            <Text
              color="$gray11"
              fontSize="$4"
              fontWeight="600"
              opacity={0.8}
            >
              {userEmail}
            </Text>
          </XStack>
        )}
        {subtitle && (
          <Text color="$gray11" fontSize="$3" opacity={0.7}>
            {subtitle}
          </Text>
        )}
      </YStack>
    </YStack>
  );
}
