import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';

interface GroupsSearchBarProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
}

export function GroupsSearchBar({ searchTerm, onSearchChange, placeholder }: GroupsSearchBarProps) {
  return (
    <View style={styles.searchSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder ?? "Search groups..."}
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.base,
    color: colors.white,
  },
});
