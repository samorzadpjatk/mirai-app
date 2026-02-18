import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useLocalSearchParams } from "expo-router";
import { commonStyles } from "~/styles/commonStyles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import AdminRewardsModal from "~/components/admin/rewards/AdminRewardsModal";
import AdminRewardDetailModal from "~/components/admin/rewards/AdminRewardDetailModal";
import { useAdminRewards } from "~/hooks/rewards";
import { useQuery } from "@tanstack/react-query";

export default function AdminRewardsPage() {
  const trpc = useTRPC();
  const params = useLocalSearchParams();
  const tripIdParam =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const tripId = useMemo(() => tripIdParam ?? "all", [tripIdParam]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const insets = useAppSafeAreaInsets();

  // Get trip details for header (admin version - no participation required)
  const { data: trip, error: tripError } = useQuery({
    ...(tripIdParam
      ? trpc.trip.getByIdAdmin.queryOptions({ id: tripIdParam })
      : {}),
    enabled: Boolean(tripIdParam),
  });

  const tripName = trip?.name ?? null;

  // Get rewards for the specific trip (admin version - no participation required)
  const {
    data: rewards,
    isLoading,
    error: rewardsError,
  } = useAdminRewards(tripId);

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
          {tripName
            ? `Nagrody dla wycieczki: ${tripName}`
            : tripIdParam
              ? "Nagrody dla wybranej wycieczki"
              : "Wszystkie nagrody w systemie"}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {rewardsError ? (
          <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="warning" size={48} color="#ef4444" />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>Nie udało się załadować nagród</Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: "center", fontSize: 12, color: "#666" }]}>
              {rewardsError instanceof Error ? rewardsError.message : "Spróbuj ponownie"}
            </Text>
          </View>
        ) : tripError ? (
          <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="warning" size={48} color="#ef4444" />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
              Wycieczka {tripName ? `"${tripName}"` : "(wybrana)"} nie istnieje
            </Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: "center", fontSize: 12, color: "#666" }]}>
              Sprawdź czy wybrano poprawną wycieczkę w panelu admina
            </Text>
          </View>
        ) : isLoading ? (
          <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
            <Text style={[commonStyles.textSecondary, { color: "#9ca3af" }]}>
              Ładowanie nagród...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {rewards && rewards.length > 0 ? (
              rewards.map((reward) => (
              <TouchableOpacity
                key={reward.id}
                onPress={() => setSelectedRewardId(reward.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#0f2323",
                  borderWidth: 1,
                  borderColor: "#273a3a",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                  { (reward.signedImageUrl ?? reward.image) && (
                    <Image
                      source={{ uri: reward.signedImageUrl ?? reward.image ?? undefined }}
                      style={{ width: 72, aspectRatio: 1, borderRadius: 12, backgroundColor: "#0b1a1a" }}
                      resizeMode="cover"
                    />
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[commonStyles.h4, { marginBottom: 4 }]}>
                      {reward.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { color: "#9ca3af", marginBottom: 8 }]} numberOfLines={2}>
                      {reward.description}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 16,
                        flexWrap: "wrap",
                        rowGap: 8,
                      }}
                    >
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
                          {reward.purchasedCount ?? 0} zakupionych
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                    Utworzona: {new Date(reward.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={[commonStyles.label, { color: "#6b7280" }]}>
                    {reward.createdBy?.firstName} {reward.createdBy?.lastName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}>
              <Ionicons name="gift" size={48} color="#6b7280" />
              <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}>
                {tripIdParam
                  ? `Brak nagród dla wycieczki: ${tripName ?? "(nazwa wczytywana)"}`
                  : "Brak nagród w systemie"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={[commonStyles.button, { marginTop: 16 }]}
              >
                <Text style={commonStyles.buttonText}>Dodaj pierwszą nagrodę</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        )}
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
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tripId={tripId}
        tripName={tripName}
      />
      {selectedRewardId && (
        <AdminRewardDetailModal
          rewardId={selectedRewardId}
          onClose={() => setSelectedRewardId(null)}
        />
      )}
    </View>
  );
}
