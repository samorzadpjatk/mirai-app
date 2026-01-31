import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAdminChallenges, type AdminChallengeUI } from "~/hooks/admin";
import ChallengeCard from "~/components/admin/ChallengeCard";
import AddChallengeModal from "~/components/admin/AddChallengeModal";
import EditChallengeModal from "~/components/admin/EditChallengeModal";
import AdminStats from "~/components/admin/AdminStats";
import { commonStyles } from "~/styles/commonStyles";

export default function AdminChallengesScreen() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChallenge, setEditingChallenge] =
    useState<AdminChallengeUI | null>(null);

  const { challenges, isLoading, deleteChallenge, stats } =
    useAdminChallenges();

  const handleBackPress = () => {
    router.back();
  };

  const handleDeleteChallenge = (id: string, tripId: string) => {
    Alert.alert(
      "Delete Challenge",
      "Are you sure you want to delete this challenge?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteChallenge(id, tripId)
              .then(() => Alert.alert("Deleted", "Challenge deleted"))
              .catch(() => Alert.alert("Error", "Failed to delete challenge"));
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f2323" }}>
        <Text style={{ color: "#fff", padding: 24 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2323" />

      {/* Header */}
      <SafeAreaView>
        <View
          style={[
            commonStyles.p24,
            commonStyles.flexRow,
            commonStyles.flexBetween,
            { paddingBottom: 16 },
          ]}
        >
          <View
            style={[commonStyles.flexRow, { alignItems: "center", gap: 16 }]}
          >
            <TouchableOpacity
              onPress={handleBackPress}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: "#162e2e",
                borderWidth: 1,
                borderColor: "#273a3a",
              }}
            >
              <MaterialIcons name="arrow-back-ios-new" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={[commonStyles.h3]}>Manage Challenges</Text>
          </View>

          <View
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="shield" size={30} color="#00ced1" />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={[commonStyles.flex1, commonStyles.px16, { paddingBottom: 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button */}
        <View style={{ paddingVertical: 16 }}>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={commonStyles.button}
          >
            <MaterialIcons name="add-circle" size={24} color="#0f2323" />
            <Text style={commonStyles.buttonText}>Add New Challenge</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <AdminStats stats={stats} />

        {/* List Header */}
        <View
          style={[
            commonStyles.flexRow,
            commonStyles.flexBetween,
            commonStyles.mb16,
          ]}
        >
          <Text style={[commonStyles.h4]}>Existing Challenges</Text>
          <Text
            style={[
              commonStyles.labelPrimary,
              { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
            ]}
          >
            PJAPP MIRAI
          </Text>
        </View>

        {/* Challenges List */}
        <View style={[commonStyles.mt16, { gap: 12 }]}>
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onEdit={(c) => setEditingChallenge(c)}
              onDelete={(id, tId) => handleDeleteChallenge(id, tId ?? "")}
            />
          ))}
        </View>
      </ScrollView>

      {/* Add Challenge Modal */}
      <AddChallengeModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Challenge Modal */}
      {editingChallenge && (
        <EditChallengeModal
          visible={!!editingChallenge}
          onClose={() => setEditingChallenge(null)}
          challenge={editingChallenge}
        />
      )}
    </View>
  );
}
