import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { UserAvatar } from "~/components/map/ui/UserAvatar";
import { useMapOverlayContext } from "~/contexts/map/MapOverlayContext";

export function ManageSharingModal() {
  const {
    showManageModal,
    setShowManageModal,
    sharingSettings,
    removeUser,
    isRemovingUser,
  } = useMapOverlayContext();
  const users = sharingSettings?.usersToShareWith ?? [];

  return (
    <Modal
      visible={showManageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowManageModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowManageModal(false)}
      >
        <Pressable
          style={styles.modalContent}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Location Sharing</Text>
            <Pressable onPress={() => setShowManageModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalUsersList}>
            {users.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  You're not sharing your location with anyone
                </Text>
              </View>
            ) : (
              users.map((user) => {
                const fullName =
                  `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

                return (
                  <View key={user.id} style={styles.modalUserItem}>
                    <View style={styles.modalUserInfo}>
                      <View style={styles.avatarWrapperSmall}>
                        <UserAvatar
                          imageUrl={user.image}
                          name={fullName}
                          size={48}
                        />
                      </View>
                      <View>
                        <Text style={styles.modalUserName}>
                          {fullName !== "" ? fullName : "Unknown"}
                        </Text>
                        <Text style={styles.sharingText}>Sharing location</Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeUser(user.id)}
                      disabled={isRemovingUser}
                    >
                      {isRemovingUser ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Text style={styles.removeButtonText}>Remove</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(23, 24, 28, 0.95)",
    borderRadius: 24,
    width: "85%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.35)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  modalClose: {
    fontSize: 24,
    color: "#EDE9FE",
    fontWeight: "600",
  },
  modalUsersList: {
    padding: 16,
    paddingTop: 8,
  },
  modalUserItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.2)",
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarWrapperSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(0, 206, 209, 0.4)",
    overflow: "hidden",
    backgroundColor: "rgba(23, 24, 28, 0.8)",
    padding: 2,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  sharingText: {
    fontSize: 12,
    color: "rgba(34, 197, 94, 0.7)",
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "rgba(226,232,240,0.5)",
    textAlign: "center",
  },
});
