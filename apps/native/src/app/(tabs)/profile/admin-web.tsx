import { useEffect } from "react";
import {
  Alert,
  Linking,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "~/styles";

const DEFAULT_ADMIN_WEB_URL = "http://localhost:3000";

const getAdminWebUrl = () => {
  const env = process.env as Record<string, unknown>;
  const value = env.EXPO_PUBLIC_ADMIN_WEB_URL;
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_ADMIN_WEB_URL;
  }
  return value;
};

export default function AdminWebRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    const openAdminWeb = async () => {
      const adminWebUrl = getAdminWebUrl();
      const canOpen = await Linking.canOpenURL(adminWebUrl);

      if (!canOpen) {
        Alert.alert(
          "Admin unavailable",
          "We could not open the web admin link. Please contact support.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/profile"),
            },
          ],
        );
        return;
      }

      await Linking.openURL(adminWebUrl);
      router.replace("/profile");
    };

    void openAdminWeb();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>Opening web admin</Text>
      <Text style={styles.subtitle}>
        Admin tools are now available in the web dashboard.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sm,
    textAlign: "center",
  },
});
