import { View, Text } from "react-native";

export type BadgeStatus = "pending" | "synced" | "failed";

interface PendingBadgeProps {
  status: BadgeStatus;
  size?: "sm" | "md" | "lg";
}

export function PendingBadge({ status, size = "md" }: PendingBadgeProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusConfig = {
    pending: {
      color: "bg-yellow-400",
      label: "Pending",
      textColor: "text-yellow-600",
    },
    synced: {
      color: "bg-green-400",
      label: "Synced",
      textColor: "text-green-600",
    },
    failed: {
      color: "bg-red-400",
      label: "Failed",
      textColor: "text-red-600",
    },
  };

  const config = statusConfig[status];

  return (
    <View className="flex-row items-center gap-1">
      <View className={`${sizeClasses[size]} rounded-full ${config.color}`} />
      <Text className={`text-xs ${config.textColor}`} accessibilityLabel={config.label}>
        {config.label}
      </Text>
    </View>
  );
}
