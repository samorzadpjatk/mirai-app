import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useAuth } from "@mirai-app/frameworks/auth/client";
import { useRouter } from "expo-router";
import { useNotifications } from "~/hooks/notifications";
import { useLocationContext } from "~/stores/location";

interface ProfileActionsSectionProps {
  onEditProfile?: () => void;
}

export function ProfileActionsSection({
  onEditProfile,
}: ProfileActionsSectionProps) {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const { isSubscribed, isLoading, onTogglePress } = useNotifications();
  const {
    isLocationSharingEnabled,
    isLoading: isLocationLoading,
    toggleLocationSharing,
    isBackgroundLocationEnabled,
    isUpdatingBackgroundLocation,
    permissionStatus,
    backgroundPermissionStatus,
    toggleBackgroundLocationUpdates,
    openSystemLocationSettings,
  } = useLocationContext();

  const handleToggle = () => {
    onTogglePress();
  };

  const handleLocationToggle = () => {
    void toggleLocationSharing();
  };

  const handleBackgroundToggle = () => {
    void toggleBackgroundLocationUpdates();
  };

  const handleOpenSystemSettings = () => {
    void openSystemLocationSettings();
  };

  const permissionModeLabel =
    permissionStatus !== "granted"
      ? "Location access: Off"
      : backgroundPermissionStatus === "granted"
        ? "Access mode: Always"
        : "Access mode: While in use";
  const isBackgroundControlDisabled =
    !isLocationSharingEnabled ||
    isLocationLoading ||
    isUpdatingBackgroundLocation;
  const isBackgroundDisplayedOn =
    isLocationSharingEnabled && isBackgroundLocationEnabled;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  const hasAdminAccess = user?.role === "ADMIN" || user?.role === "MODERATOR";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actions</Text>

      <TouchableOpacity style={styles.actionButton} onPress={onEditProfile}>
        <View style={styles.actionIcon}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
        <Text style={styles.actionText}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {hasAdminAccess ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/profile/admin-web")}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.actionTextWrap}>
            <Text style={styles.actionTitle}>Open Web Admin</Text>
            <Text style={styles.actionSubtext}>
              Admin tools are available in the web dashboard
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.actionButton, isSubscribed && styles.activeButton]}
        onPress={() => void handleToggle()}
        disabled={isLoading}
      >
        <View style={[styles.actionIcon, isSubscribed && styles.activeIcon]}>
          {isSubscribed ? (
            <Ionicons name="notifications" size={20} color={colors.primary} />
          ) : (
            <Ionicons name="notifications-off" size={20} color={colors.white} />
          )}
        </View>
        <Text style={styles.actionText}>
          {isSubscribed ? "Notifications Enabled" : "Enable Notifications"}
        </Text>
        {isSubscribed && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ON</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          isLocationSharingEnabled && styles.activeButton,
        ]}
        onPress={handleLocationToggle}
        disabled={isLocationLoading}
      >
        <View
          style={[
            styles.actionIcon,
            isLocationSharingEnabled && styles.activeIcon,
          ]}
        >
          {isLocationSharingEnabled ? (
            <Ionicons name="location" size={20} color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={colors.white} />
          )}
        </View>
        <Text style={styles.actionText}>
          {isLocationSharingEnabled
            ? "Location Sharing Enabled"
            : "Enable Location Sharing"}
        </Text>
        {isLocationSharingEnabled && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ON</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          isBackgroundDisplayedOn && styles.activeButton,
          isBackgroundControlDisabled && styles.disabledButton,
        ]}
        onPress={handleBackgroundToggle}
        disabled={isBackgroundControlDisabled}
      >
        <View
          style={[
            styles.actionIcon,
            isBackgroundDisplayedOn && styles.activeIcon,
            isBackgroundControlDisabled && styles.disabledIcon,
          ]}
        >
          <Ionicons
            name={isBackgroundDisplayedOn ? "navigate" : "navigate-outline"}
            size={20}
            color={
              isBackgroundControlDisabled
                ? colors.textMuted
                : isBackgroundDisplayedOn
                  ? colors.primary
                  : colors.white
            }
          />
        </View>
        <View style={styles.actionTextWrap}>
          <Text
            style={[
              styles.actionTitle,
              isBackgroundControlDisabled && styles.disabledText,
            ]}
          >
            Background Location
          </Text>
          <Text
            style={[
              styles.actionSubtext,
              isBackgroundControlDisabled && styles.disabledText,
            ]}
          >
            {!isLocationSharingEnabled
              ? "Enable location sharing first"
              : permissionModeLabel}
          </Text>
        </View>
        {isUpdatingBackgroundLocation ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View
            style={[
              styles.activeBadge,
              !isBackgroundDisplayedOn && styles.offBadge,
            ]}
          >
            <Text
              style={[
                styles.activeBadgeText,
                !isBackgroundDisplayedOn && styles.offBadgeText,
              ]}
            >
              {isBackgroundDisplayedOn ? "ON" : "OFF"}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsAction}
        onPress={handleOpenSystemSettings}
      >
        <Ionicons name="settings-outline" size={16} color={colors.primary} />
        <Text style={styles.settingsActionText}>
          Open system location settings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.dangerButton]}
        onPress={() => void handleSignOut()}
      >
        <View style={[styles.actionIcon, styles.dangerIcon]}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
        </View>
        <Text style={[styles.actionText, styles.dangerText]}>Sign Out</Text>
      </TouchableOpacity>
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
  },
  actionTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionSubtext: {
    color: colors.textMuted,
    fontSize: typography.xs,
  },
  dangerButton: {
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  dangerIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  dangerText: {
    color: "#ef4444",
  },
  activeButton: {
    borderColor: "rgba(0, 206, 209, 0.3)",
  },
  activeIcon: {
    backgroundColor: "rgba(0, 206, 209, 0.2)",
  },
  activeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    letterSpacing: 1,
  },
  offBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  offBadgeText: {
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledIcon: {
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  disabledText: {
    color: colors.textMuted,
  },
  settingsAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.25)",
    backgroundColor: "rgba(0, 206, 209, 0.08)",
  },
  settingsActionText: {
    color: colors.primary,
    fontSize: typography.xs,
    fontWeight: typography.medium,
  },
});
