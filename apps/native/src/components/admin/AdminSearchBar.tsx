import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { borderRadius, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface SearchField {
  key: string;
  label: string;
}

interface AdminSearchBarProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  selectedField: string;
  onFieldChange: (
    field: "firstName" | "lastName" | "email" | "wristNumber" | "houseNumber" | "groupName",
  ) => void;
  fields: SearchField[];
  placeholder?: string;
}

export function AdminSearchBar({
  searchTerm,
  onSearchChange,
  selectedField,
  onFieldChange,
  fields,
  placeholder,
}: AdminSearchBarProps) {
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);

  const selectedFieldLabel =
    fields.find((f) => f.key === selectedField)?.label.toLowerCase() ?? "items";

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={palette.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder ?? `Search by ${selectedFieldLabel}...`}
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholderTextColor={palette.textSecondary}
        />
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.fieldSelector}
      >
        {fields.map((field) => (
          <TouchableOpacity
            key={field.key}
            style={[styles.fieldOption, selectedField === field.key && styles.fieldOptionSelected]}
            onPress={() =>
              onFieldChange(
                field.key as
                  | "firstName"
                  | "lastName"
                  | "email"
                  | "wristNumber"
                  | "houseNumber"
                  | "groupName",
              )
            }
          >
            <Text
              style={[
                styles.fieldOptionText,
                selectedField === field.key && styles.fieldOptionTextSelected,
              ]}
            >
              {field.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    searchSection: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: palette.borderDark,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      fontSize: typography.base,
      color: palette.white,
    },
    fieldSelector: {
      flexDirection: "row",
    },
    fieldOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.full,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: palette.borderDark,
    },
    fieldOptionSelected: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    fieldOptionText: {
      fontSize: typography.sm,
      color: palette.textSecondary,
      fontWeight: typography.medium,
    },
    fieldOptionTextSelected: {
      color: palette.white,
    },
  });
}
