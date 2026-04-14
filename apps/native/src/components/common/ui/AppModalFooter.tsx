import { type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { XStack } from "@mirai-app/ui";
import { PrimaryLoadingButton } from "../buttons/PrimaryLoadingButton";

interface AppModalFooterProps {
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  isPrimaryLoading?: boolean;
  isPrimaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "centered" | "right";
}

export function AppModalFooter({
  children,
  primaryLabel,
  onPrimary,
  isPrimaryLoading = false,
  isPrimaryDisabled = false,
  secondaryLabel,
  onSecondary,
  style,
  variant = "centered",
}: AppModalFooterProps) {
  return (
    <XStack
      justifyContent={variant === "right" ? "flex-end" : "space-between"}
      alignItems="center"
      paddingHorizontal="$lg"
      paddingVertical="$lg"
      borderTopWidth={1}
      borderTopColor="rgba(255,255,255,0.05)"
      gap="$md"
      style={style}
    >
      {children}
      <XStack gap="$md" flex={1}>
        {secondaryLabel && onSecondary && (
          <PrimaryLoadingButton
            label={secondaryLabel}
            isLoading={false}
            onPress={onSecondary}
            disabled={isPrimaryLoading}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: "#395556",
            }}
            textStyle={{ color: "#9ca3af" }}
          />
        )}
        <PrimaryLoadingButton
          label={primaryLabel}
          isLoading={isPrimaryLoading}
          onPress={onPrimary}
          disabled={isPrimaryDisabled || isPrimaryLoading}
          style={{ flex: 1 }}
        />
      </XStack>
    </XStack>
  );
}
