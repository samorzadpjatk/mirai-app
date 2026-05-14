import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "~/styles";

interface TripNotFoundStateProps {
  message?: string;
}

export function TripNotFoundState({ message = "Trip not found" }: TripNotFoundStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: colors.textMuted,
    fontSize: typography.lg,
  },
});
