import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';
import { colors, spacing, typography } from '~/styles';
import {
  AppModalShell,
  AppModalFooter,
} from '~/components/common/ui';

interface UpdatePopupProps {
  visible: boolean;
  onUpdate: () => void;
  onSkip: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

export function UpdatePopup({
  visible,
  onUpdate,
  onSkip,
  isDownloading = false,
  downloadProgress = 0,
}: UpdatePopupProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  return (
    <AppModalShell
      visible={visible}
      title="Update Available"
      onClose={onSkip}
      variant="card"
      maxWidth={320}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          padding: spacing.lg,
          alignItems: 'center',
        }}
      >
        <View style={{ marginBottom: spacing.md }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.cardDark,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 24 }}>🔄</Text>
          </View>
        </View>

        <Text style={{
          fontSize: typography.lg,
          fontWeight: typography.semibold,
          color: colors.white,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}>Update Available</Text>
        <Text style={{
          fontSize: typography.sm,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: spacing.lg,
        }}>
          A new version of MIRAI is available with improvements and bug fixes.
        </Text>

        {isDownloading && (
          <View style={{ width: '100%', marginBottom: spacing.lg }}>
            <View style={{
              height: 4,
              backgroundColor: colors.cardDark,
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: spacing.sm,
            }}>
              <View
                style={{
                  height: '100%',
                  backgroundColor: colors.primary,
                  borderRadius: 2,
                  width: `${downloadProgress * 100}%`,
                }}
              />
            </View>
            <Text style={{
              fontSize: typography.xs,
              color: colors.textSecondary,
              textAlign: 'center',
            }}>
              Downloading... {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
        )}
      </Animated.View>
      <AppModalFooter
        primaryLabel={isDownloading ? 'Updating...' : 'Update Now'}
        onPrimary={onUpdate}
        isPrimaryLoading={isDownloading}
        isPrimaryDisabled={isDownloading}
        secondaryLabel="Skip"
        onSecondary={onSkip}
      />
    </AppModalShell>
  );
}
