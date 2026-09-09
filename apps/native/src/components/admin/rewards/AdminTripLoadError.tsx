import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "~/styles";
import { commonStyles } from "~/styles/commonStyles";

interface TripLoadErrorCopy {
  title: string;
  hint: string;
}

/**
 * Turns a failed admin trip lookup into copy that matches the actual cause.
 *
 * `trip.getByIdAdmin` is an adminProcedure, so a MODERATOR who legitimately has
 * admin-panel access still gets FORBIDDEN back from it. Reporting that as
 * "trip does not exist" sends people looking for a missing trip that is in fact
 * there, so permission errors must read as permission errors.
 */
export function describeTripLoadError(error: unknown, tripName: string | null): TripLoadErrorCopy {
  const code = (error as { code?: string } | null)?.code;

  if (code === "FORBIDDEN") {
    return {
      title: "You do not have permission to view this trip's details",
      hint: "Trip details need an administrator account. Rewards and purchases below are unaffected.",
    };
  }

  if (code === "UNAUTHORIZED") {
    return {
      title: "Your session expired",
      hint: "Sign in again to load this trip.",
    };
  }

  if (code === "NOT_FOUND") {
    return {
      title: `Trip ${tripName ? `"${tripName}"` : "(selected)"} does not exist`,
      hint: "Check if the correct trip was selected in the admin panel",
    };
  }

  return {
    title: "Failed to load trip details",
    hint: error instanceof Error ? error.message : "Try again",
  };
}

interface Props {
  error: unknown;
  tripName: string | null;
}

export function AdminTripLoadError({ error, tripName }: Props) {
  const { title, hint } = describeTripLoadError(error, tripName);

  return (
    <View
      style={{ justifyContent: "center", alignItems: "center", paddingVertical: 32 }}
      testID="admin-trip-load-error"
    >
      <Ionicons name="warning" size={48} color={colors.danger} />
      <Text
        style={[commonStyles.textSecondary, { marginTop: 16, textAlign: "center" }]}
        testID="admin-trip-load-error-title"
      >
        {title}
      </Text>
      <Text
        style={[
          commonStyles.textSecondary,
          { marginTop: 8, textAlign: "center", fontSize: 12, color: colors.gray500 },
        ]}
        testID="admin-trip-load-error-hint"
      >
        {hint}
      </Text>
    </View>
  );
}
