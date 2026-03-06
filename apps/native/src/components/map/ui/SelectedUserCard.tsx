import { Pressable, StyleSheet, Text, View } from "react-native";
import { UserAvatar } from "~/components/map/ui/UserAvatar";
import { useMapOverlayStore } from "~/stores/map";
import { formatRelativeTime } from "~/utils/format";

export function SelectedUserCard() {
  const {
    selectedUser,
    sharingUserIds,
    canStopSharing,
    onBackToList,
    onStopSharing,
  } = useMapOverlayStore();

  if (!selectedUser) return null;

  const displayName =
    selectedUser.name && selectedUser.name.trim() !== ""
      ? selectedUser.name
      : "Unknown user";
  const displaySurname =
    displayName.split(" ").slice(1).join(" ") || "-";
  const firstName = displayName.split(" ")[0] ?? displayName;
  const isSharingWithSelected = sharingUserIds.includes(selectedUser.id);

  return (
    <>
      <View style={styles.cardHeader}>
        <Pressable onPress={onBackToList} style={styles.backToListButton}>
          <Text style={styles.backToListText}>←</Text>
        </Pressable>
        <View style={styles.userHeader}>
          <View style={styles.avatarWrapper}>
            <UserAvatar
              imageUrl={selectedUser.avatarUrl}
              name={displayName}
              size={60}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{firstName}</Text>
            <Text style={styles.userSurname}>{displaySurname}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Last active</Text>
        <Text style={styles.sectionValue}>
          {formatRelativeTime(new Date(selectedUser.lastActiveAt))}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Location Sharing</Text>
        <Text style={styles.sectionValue}>
          {isSharingWithSelected
            ? "You share your location with this person"
            : "This person shares their location with you"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Group</Text>
        <Text style={styles.sectionValue}>-</Text>
      </View>

      {canStopSharing && (
        <Pressable style={styles.removeButton} onPress={onStopSharing}>
          <Text style={styles.removeButtonText}>Stop Sharing My Location</Text>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "white",
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  userSurname: {
    fontSize: 14,
    color: "rgba(226,232,240,0.8)",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: "rgba(226,232,240,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    color: "#F1F5F9",
  },
  backToListButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backToListText: {
    color: "#EDE9FE",
    fontSize: 20,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#ff6b6b",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});
