import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AppModalFooter, AppModalShell, FormField, ThemedTextInput } from "~/components/common/ui";
import { useAdminChallenges } from "~/hooks/admin";
import { useTrips } from "~/hooks/trips";
import { colors, spacing } from "~/styles";
import { type LocationCoordinate, LocationPicker } from "../../map/LocationPicker";

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface NewChallengeState {
  title: string;
  description: string;
  points: string;
  category: "standard" | "wintegral" | "special";
  icon: string;
  location?: LocationCoordinate | null;
}

export default function AddChallengeModal({ visible, onClose }: Props) {
  const [newChallenge, setNewChallenge] = useState<NewChallengeState>({
    title: "",
    description: "",
    points: "",
    category: "standard",
    icon: "star",
  });
  const [tripId, setTripId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { trips, hasNextPage, isFetchingNextPage, fetchNextPage } = useTrips();
  const { createChallenge } = useAdminChallenges();

  const handleAdd = async () => {
    if (!newChallenge.title || !newChallenge.description || !newChallenge.points || !tripId) {
      Alert.alert("Error", "Please fill in required fields (including Trip)");
      return;
    }
    setIsSubmitting(true);
    try {
      await createChallenge({
        tripId,
        title: newChallenge.title,
        description: newChallenge.description,
        points: Number(newChallenge.points),
        category: newChallenge.category,
        icon: newChallenge.icon,
        targetLatitude: newChallenge.location?.latitude,
        targetLongitude: newChallenge.location?.longitude,
      });
      setNewChallenge({
        title: "",
        description: "",
        points: "",
        category: "standard",
        icon: "star",
        location: null,
      });
      setTripId("");
      onClose();
      Alert.alert("Success", "Challenge created");
    } catch {
      Alert.alert("Error", "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const q = tripId.trim().toLowerCase();
  const filtered = q ? trips.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 6) : [];

  return (
    <>
      <AppModalShell visible={visible} title="New Challenge" onClose={onClose} variant="pageSheet">
        <ScrollView style={{ padding: spacing.lg }}>
          <FormField label="Challenge Title" required={true}>
            <ThemedTextInput
              placeholder="e.g. Campus Marathon"
              value={newChallenge.title}
              onChangeText={(t) => setNewChallenge({ ...newChallenge, title: t })}
            />
          </FormField>

          <FormField label="Trip ID" required={true}>
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
                <ScrollView nestedScrollEnabled={true} style={{ padding: 8 }}>
                  {filtered.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setTripId(t.id)}
                      style={{ paddingVertical: 8 }}
                    >
                      <Text style={{ color: colors.white }}>
                        {t.name} <Text style={{ color: colors.textSecondary }}>({t.id})</Text>
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

          <FormField label="Description" required={true}>
            <ThemedTextInput
              placeholder="Describe the goal"
              value={newChallenge.description}
              onChangeText={(t) => setNewChallenge({ ...newChallenge, description: t })}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </FormField>

          <FormField label="Location (Optional)">
            <TouchableOpacity
              onPress={() => setShowLocationPicker(true)}
              style={{
                backgroundColor: colors.backgroundDark,
                borderWidth: 1,
                borderColor: newChallenge.location ? colors.primary : colors.borderDark,
                borderRadius: spacing.sm,
                padding: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Ionicons
                  name="location"
                  size={20}
                  color={newChallenge.location ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={{
                    color: newChallenge.location ? colors.primary : colors.textSecondary,
                    flex: 1,
                  }}
                >
                  {newChallenge.location
                    ? `${newChallenge.location.latitude.toFixed(4)}, ${newChallenge.location.longitude.toFixed(4)}`
                    : "Tap to select location"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {newChallenge.location && (
              <TouchableOpacity
                onPress={() => setNewChallenge({ ...newChallenge, location: null })}
                style={{
                  marginTop: spacing.sm,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 12 }}>Clear location</Text>
              </TouchableOpacity>
            )}
          </FormField>
        </ScrollView>
        <AppModalFooter
          primaryLabel={isSubmitting ? "Saving..." : "Save Challenge"}
          onPrimary={handleAdd}
          isPrimaryLoading={isSubmitting}
          secondaryLabel="Cancel"
          onSecondary={onClose}
        />
      </AppModalShell>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        initialLocation={newChallenge.location}
        onLocationSelected={(location) => {
          setNewChallenge({ ...newChallenge, location });
          setShowLocationPicker(false);
        }}
        onClose={() => setShowLocationPicker(false)}
      />
    </>
  );
}
