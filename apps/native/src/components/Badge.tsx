import React from "react";
import { XStack, Text, type XStackProps } from "tamagui";

interface BadgeProps extends XStackProps {
  children: React.ReactNode;
}

export const Badge = ({ children, ...props }: BadgeProps) => {
  return (
    <XStack
      px="$2"
      py="$1"
      rounded="$4"
      items="center"
      justify="center"
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text fontSize="$2" fontWeight="bold">
          {children}
        </Text>
      ) : (
        children
      )}
    </XStack>
  );
};
