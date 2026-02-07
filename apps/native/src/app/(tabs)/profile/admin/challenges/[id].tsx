import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, borderRadius, typography } from '../../../../../styles';

const submissionTypes = [
  { label: 'Image', value: 'IMAGE' },
  { label: 'Multi Image', value: 'MULTI_IMAGE' },
  { label: 'Video', value: 'VIDEO' },
  { label: 'Text', value: 'TEXT' },
  { label: 'Image + Location', value: 'IMAGE_LOCATION' },
  { label: 'Location', value: 'LOCATION' },
  { label: 'QR Code', value: 'QR_CODE' },
];

const scoringCategories = [
  { label: 'Speed', value: 'SPEED' },
  { label: 'Unlimited', value: 'UNLIMITED' },
  { label: 'Judged (Staff)', value: 'JUDGED_STAFF' },
  { label: 'Peer Voting', value: 'PEER_VOTING' },
];

const statusOptions = [
  { label: 'Hidden', value: 'HIDDEN' },
  { label: 'Visible', value: 'VISIBLE' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Voting Phase', value: 'VOTING_PHASE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const formatTime = (date: Date | null) => {
  if (!date) return '';
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatIso = (date: Date | null) => (date ? date.toISOString() : '');

export default function EditChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const challengeId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0] ?? '';

  const { data: challenge, isLoading } = useQuery({
    ...trpc.challenge.getById.queryOptions({ id: challengeId, tripId }),
    enabled: !!challengeId && !!tripId,
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    submissionType: 'IMAGE',
    scoringCategory: 'SPEED',
    isRecurring: false,
    dailyStartTime: null as Date | null,
    dailyEndTime: null as Date | null,
    basePoints: '',
    firstPlacePoints: '',
    secondPlacePoints: '',
    thirdPlacePoints: '',
    status: 'HIDDEN',
    startTime: null as Date | null,
    endTime: null as Date | null,
    votingStartTime: null as Date | null,
    votingEndTime: null as Date | null,
    targetLatitude: '',
    targetLongitude: '',
    autoApprove: false,
  });

  const [initialized, setInitialized] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showVotingStartPicker, setShowVotingStartPicker] = useState(false);
  const [showVotingEndPicker, setShowVotingEndPicker] = useState(false);
  const [showDailyStartPicker, setShowDailyStartPicker] = useState(false);
  const [showDailyEndPicker, setShowDailyEndPicker] = useState(false);

  const submissionTypeLabel = useMemo(
    () => submissionTypes.find((item) => item.value === form.submissionType)?.label ?? 'Select',
    [form.submissionType],
  );

  const scoringCategoryLabel = useMemo(
    () => scoringCategories.find((item) => item.value === form.scoringCategory)?.label ?? 'Select',
    [form.scoringCategory],
  );

  const statusLabel = useMemo(
    () => statusOptions.find((item) => item.value === form.status)?.label ?? 'Select',
    [form.status],
  );

  if (challenge && !initialized) {
    setForm({
      title: challenge.name ?? '',
      description: challenge.description ?? '',
      image: challenge.image ?? '',
      submissionType: challenge.submissionType,
      scoringCategory: challenge.scoringCategory,
      isRecurring: challenge.isRecurring ?? false,
      dailyStartTime: challenge.dailyStartTime ? new Date(`1970-01-01T${challenge.dailyStartTime}:00`) : null,
      dailyEndTime: challenge.dailyEndTime ? new Date(`1970-01-01T${challenge.dailyEndTime}:00`) : null,
      basePoints: challenge.basePoints !== null && challenge.basePoints !== undefined ? String(challenge.basePoints) : '',
      firstPlacePoints:
        challenge.firstPlacePoints !== null && challenge.firstPlacePoints !== undefined
          ? String(challenge.firstPlacePoints)
          : '',
      secondPlacePoints:
        challenge.secondPlacePoints !== null && challenge.secondPlacePoints !== undefined
          ? String(challenge.secondPlacePoints)
          : '',
      thirdPlacePoints:
        challenge.thirdPlacePoints !== null && challenge.thirdPlacePoints !== undefined
          ? String(challenge.thirdPlacePoints)
          : '',
      status: challenge.status,
      startTime: challenge.startTime ? new Date(challenge.startTime) : null,
      endTime: challenge.endTime ? new Date(challenge.endTime) : null,
      votingStartTime: challenge.votingStartTime ? new Date(challenge.votingStartTime) : null,
      votingEndTime: challenge.votingEndTime ? new Date(challenge.votingEndTime) : null,
      targetLatitude:
        challenge.targetLatitude !== null && challenge.targetLatitude !== undefined
          ? String(challenge.targetLatitude)
          : '',
      targetLongitude:
        challenge.targetLongitude !== null && challenge.targetLongitude !== undefined
          ? String(challenge.targetLongitude)
          : '',
      autoApprove: challenge.autoApprove ?? false,
    });
    setInitialized(true);
  }

  const updateMutation = useMutation(
    trpc.challenge.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.challenge.getAllByTrip.queryOptions({ tripId }).queryKey,
        });
        router.back();
      },
      onError: (error) => {
        Alert.alert('Error', `Failed to update challenge: ${error.message}`);
      },
    }),
  );

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return false;
    }

    const needsLocation = form.submissionType === 'LOCATION' || form.submissionType === 'IMAGE_LOCATION';
    if (needsLocation && (!form.targetLatitude || !form.targetLongitude)) {
      Alert.alert('Error', 'Provide target latitude and longitude for location challenges');
      return false;
    }

    if (form.isRecurring) {
      if (!form.dailyStartTime || !form.dailyEndTime) {
        Alert.alert('Error', 'Provide daily start and end time');
        return false;
      }
    } else {
      if ((form.startTime && !form.endTime) || (!form.startTime && form.endTime)) {
        Alert.alert('Error', 'Provide both start and end time');
        return false;
      }
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        Alert.alert('Error', 'Start time must be before end time');
        return false;
      }

      if ((form.votingStartTime && !form.votingEndTime) || (!form.votingStartTime && form.votingEndTime)) {
        Alert.alert('Error', 'Provide both voting start and end time');
        return false;
      }
      if (form.status === 'VOTING_PHASE' && (!form.votingStartTime || !form.votingEndTime)) {
        Alert.alert('Error', 'Voting phase requires voting window');
        return false;
      }
      if (form.votingStartTime && form.votingEndTime && form.votingStartTime >= form.votingEndTime) {
        Alert.alert('Error', 'Voting start must be before voting end');
        return false;
      }
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    updateMutation.mutate({
      id: challengeId,
      tripId,
      name: form.title.trim(),
      description: form.description.trim() || undefined,
      image: form.image ? form.image.trim() : undefined,
      submissionType: form.submissionType as
        | 'IMAGE'
        | 'MULTI_IMAGE'
        | 'VIDEO'
        | 'TEXT'
        | 'IMAGE_LOCATION'
        | 'LOCATION'
        | 'QR_CODE',
      scoringCategory: form.scoringCategory as
        | 'SPEED'
        | 'UNLIMITED'
        | 'JUDGED_STAFF'
        | 'PEER_VOTING',
      isRecurring: form.isRecurring,
      dailyStartTime: formatTime(form.dailyStartTime) || undefined,
      dailyEndTime: formatTime(form.dailyEndTime) || undefined,
      basePoints: form.basePoints ? parseInt(form.basePoints, 10) : undefined,
      firstPlacePoints: form.firstPlacePoints ? parseInt(form.firstPlacePoints, 10) : undefined,
      secondPlacePoints: form.secondPlacePoints ? parseInt(form.secondPlacePoints, 10) : undefined,
      thirdPlacePoints: form.thirdPlacePoints ? parseInt(form.thirdPlacePoints, 10) : undefined,
      status: form.status as
        | 'HIDDEN'
        | 'VISIBLE'
        | 'ACTIVE'
        | 'VOTING_PHASE'
        | 'COMPLETED'
        | 'CANCELLED',
      startTime: formatIso(form.startTime) || undefined,
      endTime: formatIso(form.endTime) || undefined,
      votingStartTime: formatIso(form.votingStartTime) || undefined,
      votingEndTime: formatIso(form.votingEndTime) || undefined,
      targetLatitude: form.targetLatitude ? parseFloat(form.targetLatitude) : undefined,
      targetLongitude: form.targetLongitude ? parseFloat(form.targetLongitude) : undefined,
      autoApprove: form.autoApprove,
    });
  };

  const handleDateChange = (
    setter: (date: Date | null) => void,
    close: () => void,
  ) => (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      close();
    }
    if (event.type === 'dismissed') return;
    setter(selected ?? null);
  };

  if (!tripId || !challengeId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Missing challenge context.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
      <StatusBar style="light" />
      <ScrollView style={{ flex: 1, padding: spacing.lg }}>
        <Text style={{
          fontSize: typography.xxl,
          fontWeight: typography.bold,
          color: colors.white,
          marginBottom: spacing.lg,
        }}>
          Edit Challenge
        </Text>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Challenge Title
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
            }}
            placeholder="e.g. Campus Marathon"
            placeholderTextColor={colors.textTertiary}
            value={form.title}
            onChangeText={(value) => setForm({ ...form, title: value })}
          />
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Image URL (optional)
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
            }}
            placeholder="https://..."
            placeholderTextColor={colors.textTertiary}
            value={form.image}
            onChangeText={(value) => setForm({ ...form, image: value })}
            autoCapitalize="none"
          />
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Submission Type
          </Text>
          <View style={{
            backgroundColor: colors.cardDark,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.borderDark,
            overflow: 'hidden',
          }}>
            <Picker
              selectedValue={form.submissionType}
              onValueChange={(value) => setForm({ ...form, submissionType: value })}
              style={{ color: colors.white }}
              dropdownIconColor={colors.textSecondary}
            >
              {submissionTypes.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
          <Text style={{ color: colors.textTertiary, marginTop: spacing.xs }}>{submissionTypeLabel}</Text>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Scoring Category
          </Text>
          <View style={{
            backgroundColor: colors.cardDark,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.borderDark,
            overflow: 'hidden',
          }}>
            <Picker
              selectedValue={form.scoringCategory}
              onValueChange={(value) => setForm({ ...form, scoringCategory: value })}
              style={{ color: colors.white }}
              dropdownIconColor={colors.textSecondary}
            >
              {scoringCategories.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
          <Text style={{ color: colors.textTertiary, marginTop: spacing.xs }}>{scoringCategoryLabel}</Text>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Base Points
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
            }}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={form.basePoints}
            onChangeText={(value) => setForm({ ...form, basePoints: value })}
            keyboardType="numeric"
          />
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Podium Bonus (optional)
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.cardDark,
                borderWidth: 1,
                borderColor: colors.borderDark,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.white,
                fontSize: typography.base,
              }}
              placeholder="1st"
              placeholderTextColor={colors.textTertiary}
              value={form.firstPlacePoints}
              onChangeText={(value) => setForm({ ...form, firstPlacePoints: value })}
              keyboardType="numeric"
            />
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.cardDark,
                borderWidth: 1,
                borderColor: colors.borderDark,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.white,
                fontSize: typography.base,
              }}
              placeholder="2nd"
              placeholderTextColor={colors.textTertiary}
              value={form.secondPlacePoints}
              onChangeText={(value) => setForm({ ...form, secondPlacePoints: value })}
              keyboardType="numeric"
            />
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.cardDark,
                borderWidth: 1,
                borderColor: colors.borderDark,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.white,
                fontSize: typography.base,
              }}
              placeholder="3rd"
              placeholderTextColor={colors.textTertiary}
              value={form.thirdPlacePoints}
              onChangeText={(value) => setForm({ ...form, thirdPlacePoints: value })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Description
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
              textAlignVertical: 'top',
              minHeight: 120,
            }}
            placeholder="Describe the goal of this challenge..."
            placeholderTextColor={colors.textTertiary}
            value={form.description}
            onChangeText={(value) => setForm({ ...form, description: value })}
            multiline
          />
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Status
          </Text>
          <View style={{
            backgroundColor: colors.cardDark,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.borderDark,
            overflow: 'hidden',
          }}>
            <Picker
              selectedValue={form.status}
              onValueChange={(value) => setForm({ ...form, status: value })}
              style={{ color: colors.white }}
              dropdownIconColor={colors.textSecondary}
            >
              {statusOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
          <Text style={{ color: colors.textTertiary, marginTop: spacing.xs }}>{statusLabel}</Text>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Recurring
          </Text>
          <TouchableOpacity
            onPress={() => setForm({ ...form, isRecurring: !form.isRecurring })}
            style={{
              backgroundColor: form.isRecurring ? colors.primary : colors.cardDark,
              borderWidth: 1,
              borderColor: form.isRecurring ? colors.primary : colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: form.isRecurring ? colors.backgroundDark : colors.white,
              fontSize: typography.base,
              fontWeight: typography.bold,
            }}>
              {form.isRecurring ? 'Yes (Daily)' : 'No'}
            </Text>
          </TouchableOpacity>
        </View>

        {form.isRecurring ? (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{
              fontSize: typography.xs,
              fontWeight: typography.bold,
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: spacing.sm,
            }}>
              Daily Time Window
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setShowDailyStartPicker(true)}
                style={{
                  flex: 1,
                  backgroundColor: colors.cardDark,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                }}
              >
                <Text style={{ color: colors.white }}>
                  {form.dailyStartTime ? formatTime(form.dailyStartTime) : 'Start time'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDailyEndPicker(true)}
                style={{
                  flex: 1,
                  backgroundColor: colors.cardDark,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                }}
              >
                <Text style={{ color: colors.white }}>
                  {form.dailyEndTime ? formatTime(form.dailyEndTime) : 'End time'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setForm({
                  ...form,
                  dailyStartTime: new Date(new Date().setHours(8, 0, 0, 0)),
                  dailyEndTime: new Date(new Date().setHours(20, 0, 0, 0)),
                })}
                style={{
                  backgroundColor: colors.cardDark,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.md,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>08:00 - 20:00</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setForm({
                  ...form,
                  dailyStartTime: new Date(new Date().setHours(0, 0, 0, 0)),
                  dailyEndTime: new Date(new Date().setHours(23, 59, 0, 0)),
                })}
                style={{
                  backgroundColor: colors.cardDark,
                  borderWidth: 1,
                  borderColor: colors.borderDark,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.md,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>All day</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontSize: typography.xs,
                fontWeight: typography.bold,
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: spacing.sm,
              }}>
                Start / End
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.white }}>
                    {form.startTime ? form.startTime.toLocaleString() : 'Start time'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.white }}>
                    {form.endTime ? form.endTime.toLocaleString() : 'End time'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setForm({
                    ...form,
                    startTime: new Date(Date.now() + 60 * 60 * 1000),
                    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
                  })}
                  style={{
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Start+1h / End+3h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setForm({ ...form, startTime: null, endTime: null })}
                  style={{
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontSize: typography.xs,
                fontWeight: typography.bold,
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: spacing.sm,
              }}>
                Voting Window
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setShowVotingStartPicker(true)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.white }}>
                    {form.votingStartTime ? form.votingStartTime.toLocaleString() : 'Voting start'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowVotingEndPicker(true)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.lg,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.white }}>
                    {form.votingEndTime ? form.votingEndTime.toLocaleString() : 'Voting end'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => {
                    const base = form.endTime ?? new Date();
                    const start = new Date(base.getTime() + 60 * 60 * 1000);
                    const end = new Date(base.getTime() + 3 * 60 * 60 * 1000);
                    setForm({ ...form, votingStartTime: start, votingEndTime: end });
                  }}
                  style={{
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>After end +1h/+3h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setForm({ ...form, votingStartTime: null, votingEndTime: null })}
                  style={{
                    backgroundColor: colors.cardDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Target Location (optional)
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.cardDark,
                borderWidth: 1,
                borderColor: colors.borderDark,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.white,
                fontSize: typography.base,
              }}
              placeholder="Latitude"
              placeholderTextColor={colors.textTertiary}
              value={form.targetLatitude}
              onChangeText={(value) => setForm({ ...form, targetLatitude: value })}
              keyboardType="numeric"
            />
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.cardDark,
                borderWidth: 1,
                borderColor: colors.borderDark,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                color: colors.white,
                fontSize: typography.base,
              }}
              placeholder="Longitude"
              placeholderTextColor={colors.textTertiary}
              value={form.targetLongitude}
              onChangeText={(value) => setForm({ ...form, targetLongitude: value })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Auto-Approve Submissions
          </Text>
          <TouchableOpacity
            onPress={() => setForm({ ...form, autoApprove: !form.autoApprove })}
            style={{
              backgroundColor: form.autoApprove ? colors.primary : colors.cardDark,
              borderWidth: 1,
              borderColor: form.autoApprove ? colors.primary : colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: form.autoApprove ? colors.backgroundDark : colors.white,
              fontSize: typography.base,
              fontWeight: typography.bold,
            }}>
              {form.autoApprove ? 'Enabled' : 'Disabled'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{
            fontSize: typography.lg,
            fontWeight: typography.bold,
            color: colors.backgroundDark,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {(showStartPicker || showEndPicker || showVotingStartPicker || showVotingEndPicker || showDailyStartPicker || showDailyEndPicker) && (
        <DateTimePicker
          value={
            (showStartPicker && form.startTime) ||
            (showEndPicker && form.endTime) ||
            (showVotingStartPicker && form.votingStartTime) ||
            (showVotingEndPicker && form.votingEndTime) ||
            (showDailyStartPicker && form.dailyStartTime) ||
            (showDailyEndPicker && form.dailyEndTime) ||
            new Date()
          }
          mode={showDailyStartPicker || showDailyEndPicker ? 'time' : 'datetime'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange(
            (date) => {
              if (showStartPicker) setForm({ ...form, startTime: date });
              if (showEndPicker) setForm({ ...form, endTime: date });
              if (showVotingStartPicker) setForm({ ...form, votingStartTime: date });
              if (showVotingEndPicker) setForm({ ...form, votingEndTime: date });
              if (showDailyStartPicker) setForm({ ...form, dailyStartTime: date });
              if (showDailyEndPicker) setForm({ ...form, dailyEndTime: date });
            },
            () => {
              setShowStartPicker(false);
              setShowEndPicker(false);
              setShowVotingStartPicker(false);
              setShowVotingEndPicker(false);
              setShowDailyStartPicker(false);
              setShowDailyEndPicker(false);
            },
          )}
        />
      )}
    </View>
  );
}
