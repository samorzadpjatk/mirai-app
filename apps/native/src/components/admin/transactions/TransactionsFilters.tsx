import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';

interface GroupOption {
  id: string;
  name: string;
}

interface TransactionsFiltersProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  groups: GroupOption[];
}

export function TransactionsFilters({
  searchTerm,
  onSearchChange,
  selectedGroupId,
  onGroupChange,
  groups,
}: TransactionsFiltersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchTerm}
            onChangeText={onSearchChange}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.groupSelector}
        contentContainerStyle={styles.groupSelectorContent}
      >
        <TouchableOpacity
          style={[
            styles.groupOption,
            selectedGroupId === 'all' && styles.groupOptionSelected,
          ]}
          onPress={() => onGroupChange('all')}
        >
          <Text style={[
            styles.groupOptionText,
            selectedGroupId === 'all' && styles.groupOptionTextSelected,
          ]}>
            All Groups
          </Text>
        </TouchableOpacity>
        
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.groupOption,
              selectedGroupId === group.id && styles.groupOptionSelected,
            ]}
            onPress={() => onGroupChange(group.id)}
          >
            <Text style={[
              styles.groupOptionText,
              selectedGroupId === group.id && styles.groupOptionTextSelected,
            ]}>
              {group.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  groupSelector: {
    paddingHorizontal: spacing.lg,
  },
  groupSelectorContent: {
    paddingRight: spacing.lg,
  },
  groupOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  groupOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  groupOptionText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  groupOptionTextSelected: {
    color: colors.white,
  },
});
