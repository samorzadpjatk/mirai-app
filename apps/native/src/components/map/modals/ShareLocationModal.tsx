import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { UserAvatar } from "~/components/map/ui/UserAvatar";
import { useMapOverlayContext } from "~/contexts/map/MapOverlayContext";

export function ShareLocationModal() {
  const { shareModal, allAvailableUsers, sharingUserIds } =
    useMapOverlayContext();
  const {
    open,
    searchQuery,
    selectedUsers,
    setSearchQuery,
    toggleSelectedUser,
    reset,
    closeModal,
    confirm,
  } = shareModal;

  const users = allAvailableUsers;
  const filteredUsers = users?.filter((user) => {
    // Require minimum 3 characters before filtering
    if (!searchQuery || searchQuery.length < 3) return true;
    const query = searchQuery.toLowerCase();
    const fullName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
    return fullName.includes(query);
  });

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <Pressable style={styles.modalOverlay} onPress={closeModal}>
        <Pressable
          style={styles.modalContent}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Location With</Text>
            <Pressable onPress={closeModal}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type at least 3 characters to search..."
              placeholderTextColor="rgba(226,232,240,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {selectedUsers.size > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.selectedLabel}>
                {selectedUsers.size} selected
              </Text>
              <Pressable style={styles.clearButton} onPress={reset}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            </View>
          )}

          <ScrollView style={styles.modalUsersList}>
            {filteredUsers?.map((user) => {
              const isAlreadySharing = sharingUserIds.includes(user.id);
              const isSelected = selectedUsers.has(user.id);
              const fullName =
                `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

              return (
                <Pressable
                  key={user.id}
                  style={[
                    styles.modalUserItem,
                    (isAlreadySharing || isSelected) &&
                      styles.modalUserItemSelected,
                  ]}
                  onPress={() => {
                    if (isAlreadySharing) return;
                    toggleSelectedUser(user.id);
                  }}
                >
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
                      {isAlreadySharing && (
                        <Text style={styles.alreadySharingText}>
                          Already sharing
                        </Text>
                      )}
                    </View>
                  </View>
                  {(isAlreadySharing || isSelected) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedUsers.size > 0 && (
            <View style={styles.modalFooter}>
              <Pressable style={styles.confirmButton} onPress={confirm}>
                <Text style={styles.confirmButtonText}>
                  Add {selectedUsers.size}{" "}
                  {selectedUsers.size === 1 ? "person" : "people"}
                </Text>
              </Pressable>
            </View>
          )}
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
    maxHeight: "80%",
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
  searchContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: "rgba(0, 206, 209, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.2)",
  },
  selectedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0, 206, 209, 0.15)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.25)",
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EDE9FE",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(226,232,240,0.6)",
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
    borderColor: "transparent",
  },
  modalUserItemSelected: {
    backgroundColor: "rgba(0, 206, 209, 0.2)",
    borderColor: "rgba(0, 206, 209, 0.4)",
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  checkmark: {
    fontSize: 20,
    color: "#22c55e",
    fontWeight: "700",
  },
  alreadySharingText: {
    fontSize: 12,
    color: "rgba(34, 197, 94, 0.7)",
    marginTop: 2,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  confirmButton: {
    backgroundColor: "rgba(0, 206, 209, 0.8)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 1)",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17181c",
    letterSpacing: -0.3,
  },
});
