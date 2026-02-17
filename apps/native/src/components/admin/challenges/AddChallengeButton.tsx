import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '~/styles';

interface AddChallengeButtonProps {
  onPress: () => void;
}

export function AddChallengeButton({ onPress }: AddChallengeButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        minWidth: 120,
      }}
    >
      <Ionicons name="add-circle" size={24} color={colors.backgroundDark} />
      <Text style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.backgroundDark,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        Add New
      </Text>
    </TouchableOpacity>
  );
}
