import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { SafeAreaTop } from './SafeAreaWrapper';
import { colors, spacing, borderRadius, typography } from '../styles';

interface BackNavbarProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function BackNavbar({ title, rightAction }: BackNavbarProps) {
  const router = useRouter();

  return (
    <SafeAreaTop style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </SafeAreaTop>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  rightAction: {
    marginLeft: spacing.sm,
  },
});
