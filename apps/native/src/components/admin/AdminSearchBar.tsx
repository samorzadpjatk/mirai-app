import React from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';

interface SearchField {
  key: string;
  label: string;
}

interface AdminSearchBarProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  selectedField: string;
  onFieldChange: (field: 'firstName' | 'lastName' | 'email' | 'wristNumber' | 'houseNumber' | 'groupName') => void;
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
  const selectedFieldLabel = fields.find(f => f.key === selectedField)?.label.toLowerCase() ?? 'items';

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder ?? `Search by ${selectedFieldLabel}...`}
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldSelector}>
        {fields.map((field) => (
          <TouchableOpacity
            key={field.key}
            style={[
              styles.fieldOption,
              selectedField === field.key && styles.fieldOptionSelected,
            ]}
            onPress={() => onFieldChange(field.key as 'firstName' | 'lastName' | 'email' | 'wristNumber' | 'houseNumber' | 'groupName')}
          >
            <Text style={[
              styles.fieldOptionText,
              selectedField === field.key && styles.fieldOptionTextSelected,
            ]}>
              {field.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.base,
    color: colors.white,
  },
  fieldSelector: {
    flexDirection: 'row',
  },
  fieldOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  fieldOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fieldOptionText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  fieldOptionTextSelected: {
    color: colors.white,
  },
});
