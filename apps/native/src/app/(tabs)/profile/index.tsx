import { orpc } from "@mirai-app/orpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountInfoSection } from "~/components/profile/AccountInfoSection";
import { AppInfoFooter } from "~/components/profile/AppInfoFooter";
import { ProfileActionsSection } from "~/components/profile/ProfileActionsSection";
import { ProfileHeader } from "~/components/profile/ProfileHeader";
import { colors, spacing } from "../../../styles";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userMyQueryOptions = orpc.user.getMy.queryOptions({ input: {} });

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
        <AppInfoFooter versionLabel="PJapp v1.0.0" copyrightLabel="© 2025 PJATK" />
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
