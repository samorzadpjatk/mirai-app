import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemedTextInput } from "~/components/common/ui";
import { MapModalShell } from "~/components/map/modals/MapModalShell";
import { MapModalUserItem } from "~/components/map/modals/MapModalUserItem";
import { useMapOverlayStore } from "~/stores/map";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

export function ShareLocationModal() {
  const { shareModal, allAvailableUsers, sharingUserIds } = useMapOverlayStore();
  const styles = useThemedStyles(makeStyles);
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
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const minimumQueryLength = 2;
  const shouldShowSearchResults = normalizedQuery.length >= minimumQueryLength;
  const filteredUsers = shouldShowSearchResults
    ? users?.filter((user) => {
        const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
        return fullName.includes(normalizedQuery);
      })
    : [];

  return (
    <MapModalShell visible={open} title="Share Location With" onClose={closeModal}>
      <View style={styles.searchContainer}>
        <ThemedTextInput
          placeholder="Type at least 2 characters to search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {selectedUsers.size > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedLabel}>{selectedUsers.size} selected</Text>
          <Pressable style={styles.clearButton} onPress={reset}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      )}

      <ScrollView style={styles.modalUsersList}>
        {shouldShowSearchResults ? (
          filteredUsers?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No matching users found.</Text>
            </View>
          ) : (
            filteredUsers?.map((user) => {
              const isAlreadySharing = sharingUserIds.includes(user.id);
              const isSelected = selectedUsers.has(user.id);
              const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

              return (
                <MapModalUserItem
                  key={user.id}
                  name={fullName}
                  imageUrl={user.image}
                  subtitle={isAlreadySharing ? "Already sharing" : undefined}
                  selected={isAlreadySharing || isSelected}
                  onPress={() => {
                    if (isAlreadySharing) return;
                    toggleSelectedUser(user.id);
                  }}
                  rightElement={
                    isAlreadySharing || isSelected ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : undefined
                  }
                />
              );
            })
          )
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Type at least 2 characters to search for a person.
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedUsers.size > 0 && (
        <View style={styles.modalFooter}>
          <Pressable style={styles.confirmButton} onPress={confirm}>
            <Text style={styles.confirmButtonText}>
              Add {selectedUsers.size} {selectedUsers.size === 1 ? "person" : "people"}
            </Text>
          </Pressable>
        </View>
      )}
    </MapModalShell>
  );
}

// Note: `success` (checkmark) is a semantic status color (already sharing / selected)
// and is intentionally left on the fixed `colors` token, not the per-trip palette.
function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    searchContainer: {
      padding: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    selectedContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: palette.primaryOpacity10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: palette.primaryOpacity20,
    },
    selectedLabel: {
      fontSize: typography.sm,
      fontWeight: typography.semibold,
      color: palette.white,
    },
    clearButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    clearButtonText: {
      fontSize: typography.sm,
      fontWeight: typography.semibold,
      color: palette.textSecondary,
    },
    modalUsersList: {
      padding: spacing.md,
      paddingTop: spacing.sm,
    },
    emptyState: {
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: typography.sm,
      color: palette.textSecondary,
      textAlign: "center",
    },
    checkmark: {
      fontSize: 20,
      color: colors.success,
      fontWeight: typography.bold,
    },
    modalFooter: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: palette.borderWhite5,
    },
    confirmButton: {
      backgroundColor: palette.primaryOpacity80,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.primary,
    },
    confirmButtonText: {
      fontSize: typography.base,
      fontWeight: typography.bold,
      color: palette.backgroundDark,
      letterSpacing: -0.3,
    },
  });
}
