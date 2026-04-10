import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useGetCurrentUserQuery } from "@mirai-app/graphql-types";
import { useQuery } from "@tanstack/react-query";

const createGraphQLClient = async () => {
  const graphqlUrl =
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
  const token = await SecureStore.getItemAsync("sb-access-token");

  return new GraphQLClient(graphqlUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export function AccountInfoSection() {
  const [client, setClient] = useState<GraphQLClient | null>(null);

  useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

  const { data: currentUserData } = useQuery({
    queryKey: ["GetCurrentUser"],
    queryFn: async () => {
      if (!client) {
        throw new Error("GraphQL client not initialized");
      }
      return useGetCurrentUserQuery.fetcher(client)();
    },
    enabled: !!client,
  });

  const currentUser = currentUserData?.me;
  const email = currentUser?.email;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Information</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="mail" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: spacing.md,
  },
});
