import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface GroupsListHeaderProps {
  title: string;
  count: number;
}

export function GroupsListHeader({ title, count }: GroupsListHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View testID="groups-list-header" style={styles.listHeader}>
      <Text style={styles.listHeaderTitle}>{title}</Text>
      <Text style={styles.listHeaderCount}>{count} Results</Text>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.lg,
    },
    listHeaderTitle: {
      fontSize: 10,
      fontWeight: typography.bold,
      color: palette.primary,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    listHeaderCount: {
      fontSize: 10,
      fontWeight: typography.bold,
      color: colors.textMuted,
      textTransform: "uppercase",
    },
  });
