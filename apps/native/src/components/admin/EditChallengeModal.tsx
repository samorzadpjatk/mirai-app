import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTrips } from "~/hooks/trips";
import { useAdminChallenges } from "~/hooks/admin";
import type { AdminChallengeUI } from "~/hooks/admin";
import { commonStyles } from "~/styles/commonStyles";

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
  const { trips } = useTrips();
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[commonStyles.container]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              padding: 24,
              borderBottomWidth: 1,
              borderBottomColor: "#273a3a",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={[commonStyles.h3]}>Edit Challenge</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 24 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>
                Challenge Title
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                }}
                placeholder="e.g. Campus Marathon"
                placeholderTextColor="#6b7280"
                value={state.title}
                onChangeText={(t) => setState({ ...state, title: t })}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>
                Trip ID
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                }}
                placeholder="Trip ID or search"
                placeholderTextColor="#6b7280"
                value={tripId}
                onChangeText={setTripId}
              />

              {filtered.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#0f2323",
                    borderWidth: 1,
                    borderColor: "#273a3a",
                    marginTop: 8,
                    borderRadius: 8,
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
                        <Text style={{ color: "#fff" }}>
                          {t.name}{" "}
                          <Text style={{ color: "#9ca3af" }}>({t.id})</Text>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={[commonStyles.label, { marginBottom: 8 }]}>
                Description
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                  textAlignVertical: "top",
                }}
                placeholder="Describe the goal"
                placeholderTextColor="#6b7280"
                value={state.description}
                onChangeText={(t) => setState({ ...state, description: t })}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[commonStyles.button, { marginBottom: 24 }]}
            >
              <Text style={commonStyles.buttonText}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
