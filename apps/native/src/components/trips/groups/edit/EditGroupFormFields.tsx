import { StyleSheet, Text, TextInput, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface EditGroupFormFieldsProps {
  groupName: string;
  onChangeName: (value: string) => void;
}

export function EditGroupFormFields({ groupName, onChangeName }: EditGroupFormFieldsProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>Group Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter group name"
        placeholderTextColor="rgba(148, 163, 184, 0.4)"
        value={groupName}
        onChangeText={onChangeName}
      />
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    inputSection: {
      marginBottom: spacing.xl,
    },
    inputLabel: {
      fontSize: 10,
      fontWeight: typography.bold,
      color: palette.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    input: {
      backgroundColor: palette.cardDark,
      borderWidth: 1,
      borderColor: "rgba(48, 54, 61, 1)",
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      color: colors.white,
      fontSize: typography.base,
    },
  });
}
