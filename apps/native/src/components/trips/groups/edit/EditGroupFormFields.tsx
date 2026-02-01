import { StyleSheet, Text, TextInput, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface EditGroupFormFieldsProps {
  groupName: string;
  groupCode: string;
  onChangeName: (value: string) => void;
  onChangeCode: (value: string) => void;
}

export function EditGroupFormFields({
  groupName,
  groupCode,
  onChangeName,
  onChangeCode,
}: EditGroupFormFieldsProps) {
  return (
    <>
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

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Group Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group code"
          placeholderTextColor="rgba(148, 163, 184, 0.4)"
          value={groupCode}
          onChangeText={onChangeCode}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    color: colors.white,
    fontSize: typography.base,
  },
});
