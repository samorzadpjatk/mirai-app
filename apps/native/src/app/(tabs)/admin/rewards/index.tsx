import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { commonStyles } from "~/styles/commonStyles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import AdminRewardsModal from "~/components/admin/rewards/AdminRewardsModal";

export default function AdminRewardsPage() {
  const trpc = useTRPC();
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const insets = useAppSafeAreaInsets();

  // Get all rewards across all trips for admin view
  const { data: allRewards } = useQuery(
    trpc.reward.getByTrip.queryOptions({ tripId: "all" })
  );

  return (
    <View style={[commonStyles.container, { paddingBottom: insets.bottom }]}>
      <View style={{
        backgroundColor: "#0f2323",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#273a3a",
      }}>
        <Text style={[commonStyles.h3]}>Zarządzanie nagrodami</Text>
        <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginTop: 4 }]}>
          Zarządzaj nagrodami dla wszystkich wycieczek
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ gap: 16 }}>
          {allRewards && allRewards.length > 0 ? (
            allRewards.map((reward) => (
              <View
                key={reward.id}
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.h4, { marginBottom: 4 }]}>
                      {reward.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 8 }]}>
                      {reward.description}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="cash" size={16} color="#fbbf24" />
                        <Text style={[commonStyles.label, { color: "#fbbf24" }]}>
                          {reward.coinCost} monet
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="cube-outline" size={16} color="#10b981" />
                        <Text style={[commonStyles.label, { color: "#10b981" }]}>
                          {reward.availableQuantity} szt.
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="cart-outline" size={16} color="#00ced1" />
                        <Text style={[commonStyles.label, { color: "#00ced1" }]}>
                          {reward.purchasedCount || 0} zakupionych
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                    Utworzona: {new Date(reward.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                    {reward.createdBy?.firstName} {reward.createdBy?.lastName}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
              <Ionicons name="gift" size={48} color="#6b7280" />
              <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
                Brak nagród w systemie
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(true)}
                style={[commonStyles.button, { marginTop: 16 }]}
              >
                <Text style={commonStyles.buttonText}>Dodaj pierwszą nagrodę</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setShowCreateModal(true)}
        style={{
          position: "absolute",
          bottom: 80 + insets.bottom,
          right: 24,
          backgroundColor: "#00ced1",
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <AdminRewardsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        showCreateForm={false}
      />
      
      <AdminRewardsModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        showCreateForm={true}
      />
    </View>
  );
}
