import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';
import type { NotificationStatus } from '~/hooks/admin/useAdminNotifications';

interface NotificationFiltersProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  status: NotificationStatus;
  onStatusChange: (status: NotificationStatus) => void;
}

const statusOptions: { key: NotificationStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'failed', label: 'Failed' },
];

export function NotificationFilters({
  searchTerm,
  onSearchChange,
  status,
  onStatusChange,
}: NotificationFiltersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            value={searchTerm}
            onChangeText={onSearchChange}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.statusSelector}
        contentContainerStyle={styles.statusSelectorContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.statusOption,
              status === option.key && styles.statusOptionSelected,
            ]}
            onPress={() => onStatusChange(option.key)}
          >
            <Text style={[
              styles.statusOptionText,
              status === option.key && styles.statusOptionTextSelected,
            ]}>
              {option.label}
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
  statusSelector: {
    paddingHorizontal: spacing.lg,
  },
  statusSelectorContent: {
    paddingRight: spacing.lg,
  },
  statusOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  statusOptionTextSelected: {
    color: colors.white,
  },
});
