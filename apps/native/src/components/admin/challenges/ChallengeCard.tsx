import React, { type ComponentProps } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AdminChallengeUI } from "~/hooks/admin";
import { commonStyles } from "~/styles/commonStyles";

const CHALLENGE_ICON_MAP: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
  eco: "leaf",
  terminal: "terminal",
  flight_takeoff: "airplane",
  fitness_center: "barbell",
  star: "star",
};

export function getChallengeIcon(icon: string): ComponentProps<typeof Ionicons>["name"] {
  return CHALLENGE_ICON_MAP[icon] ?? "star";
}

export function getChallengeBackgroundColor(category: string): string {
  return category === "wintegral" ? "#00ced1" : "rgba(0, 206, 209, 0.1)";
}

export function getChallengeIconColor(category: string): string {
  return category === "wintegral" ? "#0f2323" : "#00ced1";
}

export function getChallengeStatusColor(status: string): string {
  return status === "draft" ? "#ef4444" : "#9ca3af";
}

export function getChallengeStatusLabel(status: string, category: string): string {
  if (status === "draft") return "DRAFT";
  if (category === "wintegral") return "Trip";
  return "Campus";
}

export default function ChallengeCard({
  challenge,
  onEdit,
  onDelete,
}: {
  challenge: AdminChallengeUI;
  onEdit?: (c: AdminChallengeUI) => void;
  onDelete?: (id: string, tripId?: string) => void;
}) {
  return (
    <View style={[commonStyles.card, { flexDirection: "row", alignItems: "center", gap: 16 }]}>
      <View
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: getChallengeBackgroundColor(challenge.category),
        }}
      >
        <Ionicons
          name={getChallengeIcon(challenge.icon)}
          size={24}
          color={getChallengeIconColor(challenge.category)}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[commonStyles.h4, { marginBottom: 4 }]}>{challenge.title}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Text style={{ color: "#00ced1", fontSize: 14, fontWeight: "600" }}>
            {challenge.points} PTS
          </Text>
          <Text
            style={{
              color: getChallengeStatusColor(challenge.status),
              fontSize: 10,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            • {getChallengeStatusLabel(challenge.status, challenge.category)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 4 }}>
        <TouchableOpacity style={{ padding: 8 }} onPress={() => onEdit?.(challenge)}>
          <Ionicons name="create" size={20} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={() => onDelete?.(challenge.id, challenge.tripId)}
        >
          <Ionicons name="trash" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
