import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTrips } from "~/hooks/trips";
import { useAdminChallenges } from "@mirai-app/shared/hooks";
import type { AdminChallengeUI } from "@mirai-app/shared/hooks";
import { colors, spacing } from "~/styles";
import {
  AppModalShell,
  AppModalFooter,
  FormField,
  ThemedTextInput,
} from "~/components/common/ui";

interface Props {
  visible: boolean;
  onClose: () => void;
  challenge: AdminChallengeUI;
}

export default function EditChallengeModal({
  visible,
  onClose,
  challenge,
}: Props) {
  const [state, setState] = useState({
    title: challenge.title,
    description: challenge.description,
    points: String(challenge.points),
    category: challenge.category,
    icon: challenge.icon,
  });
  const [tripId, setTripId] = useState<string>(challenge.tripId ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const { trips, hasNextPage, isFetchingNextPage, fetchNextPage } = useTrips();
  const { updateChallenge } = useAdminChallenges();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateChallenge(challenge.id, {
        tripId,
        title: state.title,
        description: state.description,
        points: Number(state.points),
        category: state.category,
        icon: state.icon,
      });
      onClose();
      Alert.alert("Saved", "Challenge updated");
    } catch {
      Alert.alert("Error", "Failed to update challenge");
    } finally {
      setIsSaving(false);
    }
  };

  const q = tripId.trim().toLowerCase();
  const filtered = q
    ? trips.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 6)
    : [];

  return (
    <AppModalShell
      visible={visible}
      title="Edit Challenge"
      onClose={onClose}
      variant="pageSheet"
    >
      <ScrollView style={{ padding: spacing.lg }}>
          <FormField label="Challenge Title" required>
            <ThemedTextInput
              placeholder="e.g. Campus Marathon"
              value={state.title}
              onChangeText={(t) => setState({ ...state, title: t })}
            />
          </FormField>

          <FormField label="Trip ID" required>
            <ThemedTextInput
              placeholder="Trip ID or search"
              value={tripId}
              onChangeText={setTripId}
            />

            {(filtered.length > 0 || (q.length > 0 && hasNextPage)) && (
              <View
                style={{
                  backgroundColor: colors.backgroundDark,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                  marginTop: spacing.sm,
                  borderRadius: spacing.sm,
                  maxHeight: 160,
                }}
              >
                <ScrollView nestedScrollEnabled style={{ padding: 8 }}>
                  {filtered.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setTripId(t.id)}
                      style={{ paddingVertical: 8 }}
                    >
                      <Text style={{ color: colors.white }}>
                        {t.name}{" "}
                        <Text style={{ color: colors.textSecondary }}>({t.id})</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {hasNextPage && (
                    <TouchableOpacity
                      onPress={() => {
                        void fetchNextPage();
                      }}
                      disabled={isFetchingNextPage}
                      style={{
                        marginTop: spacing.sm,
                        paddingVertical: spacing.sm,
                        borderRadius: spacing.sm,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isFetchingNextPage ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={{ color: colors.primary, fontWeight: "600" }}>
                          Load more trips
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            )}
            </FormField>

          <FormField label="Description" required>
            <ThemedTextInput
              placeholder="Describe the goal"
              value={state.description}
              onChangeText={(t) => setState({ ...state, description: t })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </FormField>

      </ScrollView>
      <AppModalFooter
        primaryLabel={isSaving ? "Saving..." : "Save Changes"}
        onPrimary={handleSave}
        isPrimaryLoading={isSaving}
        secondaryLabel="Cancel"
        onSecondary={onClose}
      />
    </AppModalShell>
  );
}
