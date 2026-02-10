import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { spacing } from '~/styles';
import { useAppSafeAreaInsets } from '~/contexts/safeArea';
import { JudgementProvider } from '~/contexts/judgement';
import { JudgementContent } from '~/components/judgement/JudgementContent';
import { viewStyles, textStyles } from '~/styles/judgement';

export default function ChallengeJudgementScreen() {
  const insets = useAppSafeAreaInsets();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0] ?? '';
  const challengeId =
    typeof params.challengeId === 'string' ? params.challengeId : params.challengeId?.[0] ?? '';

  if (!tripId || !challengeId) {
    return (
      <View style={[viewStyles.container, viewStyles.centered]}>
        <Text style={textStyles.emptyText}>Missing challenge context.</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        viewStyles.container,
        {
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.xxxl,
        },
      ]}
    >
      <Stack.Screen options={{ title: 'Challenge Judgement' }} />
      <StatusBar barStyle="light-content" />
      <JudgementProvider tripId={tripId} challengeId={challengeId}>
        <JudgementContent />
      </JudgementProvider>
    </View>
  );
}