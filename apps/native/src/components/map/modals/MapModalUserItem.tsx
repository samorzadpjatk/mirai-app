import type { ReactNode } from "react";
import { ThemedListItem } from "~/components/common/ui";

interface MapModalUserItemProps {
  name: string;
  imageUrl?: string | null;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  bordered?: boolean;
  rightElement?: ReactNode;
}

export function MapModalUserItem({
  name,
  imageUrl,
  subtitle,
  onPress,
  disabled = false,
  selected = false,
  bordered = false,
  rightElement,
}: MapModalUserItemProps) {
  return (
    <ThemedListItem
      title={name === "" ? "Unknown" : name}
      subtitle={subtitle}
      leftAvatar={{ name, imageUrl }}
      rightElement={rightElement}
      onPress={onPress}
      disabled={disabled}
      selected={selected}
      bordered={bordered}
    />
  );
}
