import { type ReactNode } from "react";
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import { AppModalShell } from "~/components/common/ui";

interface MapModalShellProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: DimensionValue;
  contentStyle?: StyleProp<ViewStyle>;
}

export function MapModalShell({
  visible,
  title,
  onClose,
  children,
  maxHeight = "80%",
  contentStyle,
}: MapModalShellProps) {
  return (
    <AppModalShell
      visible={visible}
      title={title}
      onClose={onClose}
      variant="card"
      maxHeight={maxHeight}
      contentStyle={contentStyle}
    >
      {children}
    </AppModalShell>
  );
}
