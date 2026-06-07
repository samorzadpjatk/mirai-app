import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { colors, spacing, typography } from "~/styles";

interface DownloadForOfflineButtonProps {
  tripId: string;
}

export function DownloadForOfflineButton({ tripId }: DownloadForOfflineButtonProps) {
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleDownload = async () => {
    if (isDownloading || !tripId) return;

    setIsDownloading(true);
    setIsComplete(false);

    try {
      // Pre-fetch all active trip data
      await Promise.all([
        queryClient.fetchQuery({
          ...orpc.trip.getById.queryOptions({ input: { id: tripId } }),
          queryKey: ["trip", tripId, { persist: true }],
        }),
        queryClient.fetchQuery({
          ...orpc.group.getAll.queryOptions({ input: { tripId } }),
          queryKey: ["group", tripId, { persist: true }],
        }),
        queryClient.fetchQuery({
          ...orpc.challenge.getAll.queryOptions({ input: { tripId } }),
          queryKey: ["challenge", tripId, { persist: true }],
        }),
        queryClient.fetchQuery({
          ...orpc.tripParticipant.getByTrip.queryOptions({ input: { tripId } }),
          queryKey: ["participants", tripId, { persist: true }],
        }),
        queryClient.fetchQuery({
          ...orpc.resource.getByTrip.queryOptions({ input: { tripId } }),
          queryKey: ["resources", tripId, { persist: true }],
        }),
      ]);

      setIsComplete(true);
      setTimeout(() => setIsComplete(false), 3000);
    } catch (error) {
      console.error("Failed to download for offline:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isComplete && styles.completeButton]}
      onPress={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : isComplete ? (
        <>
          <Ionicons name="checkmark" size={16} color={colors.success} />
          <Text style={[styles.text, styles.completeText]}>Downloaded</Text>
        </>
      ) : (
        <>
          <Ionicons name="cloud-download" size={16} color={colors.primary} />
          <Text style={styles.text}>Download for offline</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.25)",
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  completeButton: {
    borderColor: "rgba(34, 197, 94, 0.25)",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  text: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  completeText: {
    color: colors.success,
  },
});
