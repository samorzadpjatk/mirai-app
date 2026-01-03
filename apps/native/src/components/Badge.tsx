import React from "react";
import { XStack, Text, type XStackProps } from "tamagui";

interface BadgeProps extends XStackProps {
  children: React.ReactNode;
}

export const Badge = ({ children, ...props }: BadgeProps) => {
  return (
    <XStack
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$4"
      alignItems="center"
      justifyContent="center"
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
