import { Text, View } from "react-native";
import { commonStyles } from "~/styles/commonStyles";
import { useTripTheme } from "~/theme/TripThemeProvider";

export default function AdminStats({
  stats,
}: {
  stats: { activeChallenges: number; wintegralChallenges: number };
}) {
  const { palette } = useTripTheme();

  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
      <View style={[commonStyles.card, { flex: 1, backgroundColor: palette.cardDark }]}>
        <Text style={[commonStyles.label, { marginBottom: 4 }]}>Active</Text>
        <Text style={[commonStyles.h3, { color: palette.primary, lineHeight: 24 }]}>
          {stats.activeChallenges}
        </Text>
      </View>

      <View style={[commonStyles.card, { flex: 1, backgroundColor: palette.cardDark }]}>
        <Text style={[commonStyles.label, { marginBottom: 4 }]}>Wintegral</Text>
        <Text style={[commonStyles.h3, { color: "#fff", lineHeight: 24 }]}>
          {stats.wintegralChallenges}
        </Text>
      </View>
    </View>
  );
}
