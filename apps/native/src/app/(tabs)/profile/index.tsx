import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "@mirai-app/ui";
import { AccountInfoSection } from "~/components/profile/AccountInfoSection";
import { AppInfoFooter } from "~/components/profile/AppInfoFooter";
import { ProfileActionsSection } from "~/components/profile/ProfileActionsSection";
import { ProfileHeader } from "~/components/profile/ProfileHeader";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useGetCurrentUserQuery } from "@mirai-app/graphql-client";

// Spacing values from Tamagui tokens for React Native styles
const spacing = {
  lg: 16,
  xl: 20,
  xxxl: 32,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Get the reexecute function from the query hook
  const [, reexecuteCurrentUser] = useGetCurrentUserQuery();

  // Refresh profile data on focus
  useFocusEffect(
    useCallback(() => {
      // Reexecute the current user query with network-only policy
      void reexecuteCurrentUser({ requestPolicy: "network-only" });
    }, [reexecuteCurrentUser]),
  );

  return (
    <YStack flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ProfileHeader />

        {/* Account Info */}
        <AccountInfoSection />

        {/* Actions */}
        <ProfileActionsSection
          onEditProfile={() => router.push("/profile/edit")}
        />

        {/* App Info */}
        <AppInfoFooter
          versionLabel="PJapp v1.0.0"
          copyrightLabel="© 2025 PJATK"
        />
      </ScrollView>
    </YStack>
  );
}
