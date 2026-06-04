import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { MapModalShell } from "~/components/map/modals/MapModalShell";
import { MapModalUserItem } from "~/components/map/modals/MapModalUserItem";
import { useMapOverlayStore } from "~/stores/map";
import { borderRadius, colors, spacing, typography } from "~/styles";

export function ManageSharingModal() {
  const { showManageModal, setShowManageModal, sharingSettings, isRemovingUser, handleRemoveUser } =
    useMapOverlayStore();
  const users = sharingSettings?.usersToShareWith ?? [];

  return (
    <MapModalShell
      visible={showManageModal}
      title="Manage Location Sharing"
      onClose={() => setShowManageModal(false)}
      maxHeight="70%"
    >
      <View style={styles.modalUsersList}>
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>You're not sharing your location with anyone</Text>
          </View>
        ) : (
          users.map((user) => {
            const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

            return (
              <MapModalUserItem
                key={user.id}
                name={fullName}
                imageUrl={user.image}
                subtitle="Sharing location"
                bordered={true}
                rightElement={
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveUser(user.id)}
                    disabled={isRemovingUser}
                  >
                    {isRemovingUser ? (
                      <ActivityIndicator
                        testID="remove-loading-indicator"
                        size="small"
                        color={colors.danger}
                      />
                    ) : (
                      <Text style={styles.removeButtonText}>Remove</Text>
                    )}
                  </Pressable>
                }
              />
            );
          })
        )}
      </View>
    </MapModalShell>
  );
}

const styles = StyleSheet.create({
  modalUsersList: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.red900Opacity30,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removeButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.danger,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
