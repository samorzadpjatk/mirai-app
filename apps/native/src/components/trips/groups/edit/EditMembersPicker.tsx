import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface ParticipantUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

interface Participant {
  user: ParticipantUser;
}

interface EditMembersPickerProps {
  participants: Participant[];
  selectedMembers: Set<string>;
  isLoading: boolean;
  organizerId?: string | null;
  onToggleMember: (userId: string) => void;
}

export function EditMembersPicker({
  participants,
  selectedMembers,
  isLoading,
  organizerId,
  onToggleMember,
}: EditMembersPickerProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  if (isLoading) {
    return (
      <View testID="edit-members-picker-loading" style={styles.loadingContainer}>
        <ActivityIndicator
          testID="edit-members-picker-indicator"
          size="large"
          color={palette.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.memberListContainer}>
      <ScrollView
        testID="edit-members-picker-scroll"
        style={styles.memberListScroll}
        showsVerticalScrollIndicator={false}
      >
        {participants.length > 0 ? (
          participants.map((participant) => {
            const isSelected = selectedMembers.has(participant.user.id);
            const isOrganizerUser = participant.user.id === organizerId;
            const initials =
              `${participant.user.firstName?.charAt(0) ?? ""}${participant.user.lastName?.charAt(0) ?? ""}`.toUpperCase() ||
              "?";

            return (
              <TouchableOpacity
                key={participant.user.id}
                testID={`member-item-${participant.user.id}`}
                style={styles.memberItem}
                onPress={() => onToggleMember(participant.user.id)}
                activeOpacity={0.7}
                disabled={isOrganizerUser}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{initials}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {participant.user.firstName} {participant.user.lastName}
                  </Text>
                  <Text style={styles.memberEmail}>
                    {participant.user.email}
                    {isOrganizerUser && " (Organizer)"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                    isOrganizerUser && styles.checkboxDisabled,
                  ]}
                >
                  {isSelected ? <View style={styles.checkboxInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No participants found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    memberListContainer: {
      backgroundColor: colors.cardDark,
      borderWidth: 1,
      borderColor: "rgba(48, 54, 61, 1)",
      borderRadius: borderRadius.xl,
      overflow: "hidden",
    },
    memberListScroll: {
      maxHeight: 340,
    },
    loadingContainer: {
      paddingVertical: spacing.xxxl,
      alignItems: "center",
    },
    memberItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      backgroundColor: colors.textMuted,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    memberAvatarText: {
      fontSize: typography.sm,
      fontWeight: typography.bold,
      color: colors.white,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: typography.sm,
      fontWeight: typography.semibold,
      color: colors.white,
      marginBottom: 2,
    },
    memberEmail: {
      fontSize: 12,
      color: colors.textMuted,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "rgba(48, 54, 61, 1)",
      backgroundColor: colors.backgroundDark,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      borderColor: palette.primary,
      backgroundColor: palette.primary,
    },
    checkboxDisabled: {
      opacity: 0.5,
    },
    checkboxInner: {
      width: 10,
      height: 10,
      borderRadius: 3,
      backgroundColor: colors.backgroundDark,
    },
    emptyState: {
      paddingVertical: spacing.xxxl,
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: typography.base,
      color: colors.textMuted,
    },
  });
