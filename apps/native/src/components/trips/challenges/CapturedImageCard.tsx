import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { borderRadius, colors, spacing, typography } from '~/styles';

interface CapturedImageCardProps {
  imageUri: string;
  onRetake: () => void;
  onDone: () => void;
}

export function CapturedImageCard({ imageUri, onRetake, onDone }: CapturedImageCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenge Completed! ✅</Text>

      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onRetake} style={styles.retakeButton}>
          <MaterialIcons name="refresh" size={20} color="#ef4444" />
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDone} style={styles.doneButton}>
          <MaterialIcons name="check-circle" size={20} color={colors.backgroundDark} />
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.3)',
  },
  title: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  retakeText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  doneText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
