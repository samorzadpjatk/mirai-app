import { Ionicons } from "@expo/vector-icons";
import { formatDisplayName } from "@mirai-app/common/users";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Group, User } from "~/hooks/admin/useAdminUsers";
import { spacing, typography } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";
import { AdminModal, AdminModalButton } from "../AdminModal";

interface GroupAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  groups: Group[] | undefined;
  onAssign: (
    userId: string,
    groupId: string,
  ) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tripId: string;
    groupId: string | null;
    userId: string;
    wristNumber: string | null;
    houseNumber: string | null;
  }>;
  loading?: boolean;
}

export function GroupAssignmentModal({
  visible,
  onClose,
  user,
  groups,
  onAssign,
  loading = false,
}: GroupAssignmentModalProps) {
  const { palette } = useTripTheme();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleAssign = async () => {
    if (!user || !selectedGroup) return;

    try {
      await onAssign(user.id, selectedGroup.id);
      setSelectedGroup(null);
      onClose();
    } catch {
      // TODO: Add Sentry crash reporting for production errors
    }
  };

  const handleClose = () => {
    setSelectedGroup(null);
    onClose();
  };

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title="Assign to Group"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={handleClose} variant="cancel" />
          <AdminModalButton
            title="Assign"
            onPress={handleAssign}
            disabled={!selectedGroup || loading}
            loading={loading}
          />
        </>
      }
    >
      {user && (
        <View style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              fontSize: typography.base,
              fontWeight: typography.semibold,
              color: palette.white,
              marginBottom: spacing.xs,
            }}
          >
            {formatDisplayName(user.firstName, user.lastName) ?? "Unknown User"}
          </Text>
          <Text
            style={{
              fontSize: typography.sm,
              color: palette.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            {user.email}
          </Text>
          {user.group && (
            <Text style={{ fontSize: typography.sm, color: palette.primary }}>
              Current: {user.group.name}
            </Text>
          )}
        </View>
      )}

      <ScrollView style={{ maxHeight: 300 }}>
        {Array.isArray(groups) &&
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.borderWhite5,
                },
                selectedGroup?.id === group.id && {
                  backgroundColor: palette.primaryOpacity10,
                },
              ]}
              onPress={() => setSelectedGroup(group)}
            >
              <Text
                style={[
                  { fontSize: typography.base, color: palette.white, flex: 1 },
                  selectedGroup?.id === group.id && {
                    color: palette.primary,
                    fontWeight: typography.semibold,
                  },
                ]}
              >
                {group.name}
              </Text>
              {selectedGroup?.id === group.id && (
                <Ionicons name="checkmark" size={18} color={palette.primary} />
              )}
            </TouchableOpacity>
          ))}
      </ScrollView>
    </AdminModal>
  );
}
