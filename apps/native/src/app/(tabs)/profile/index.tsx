import { View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../../styles";
import { AccountInfoSection } from "~/components/profile/AccountInfoSection";
import { AppInfoFooter } from "~/components/profile/AppInfoFooter";
import { ProfileActionsSection } from "~/components/profile/ProfileActionsSection";
import { ProfileHeader } from "~/components/profile/ProfileHeader";
import { useRouter, useFocusEffect } from "expo-router";
import { useTRPC } from "@repo/frameworks/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const userMyQueryOptions = trpc.user.getMy.queryOptions();

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({
        queryKey: userMyQueryOptions.queryKey,
      });
    }, [queryClient, userMyQueryOptions.queryKey]),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ProfileHeader />

        {/* Account Info */}
        <AccountInfoSection />

        {/* Actions */}
        <ProfileActionsSection onEditProfile={() => router.push("/profile/edit")} />

        {/* App Info */}
        <AppInfoFooter
          versionLabel="PJapp v1.0.0"
          copyrightLabel="© 2025 PJATK"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
