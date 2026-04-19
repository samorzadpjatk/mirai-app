/**
 * useChallengeForm Hook
 *
 * Custom hook for challenge form state management with complex validation.
 * Integrates react-hook-form with the shared challengeFormSchema.
 *
 * ## Usage
 *
 * ```tsx
 * function CreateChallengeForm() {
 *   const {
 *     register,
 *     handleSubmit,
 *     formState: { errors, isValid, isDirty },
 *     watch,
 *     setValue,
 *     reset,
 *     challengeType,
 *     isPeerVoting,
 *     isRecurring,
 *   } = useChallengeForm();
 *
 *   const onSubmit = async (data: ChallengeFormSchema) => {
 *     await createChallenge(data);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <Input {...register('name')} error={errors.name?.message} />
 *       {isPeerVoting && (
 *         <VotingConfigurationFields register={register} errors={errors} />
 *       )}
 *     </form>
 *   );
 * }
 * ```
 *
 * ## Effect DI Integration
 *
 * This hook is designed to work with the Effect-based use case layer.
 * The form data is validated against the domain constraints and can be
 * passed directly to Effect-based use cases like CreateChallengeUseCase.
 *
 * @module @mirai-app/web/hooks/admin/useChallengeForm
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  challengeFormSchema,
  type ChallengeFormSchema,
  type ChallengeSubmissionType,
  type ChallengeScoringCategory,
} from '@/lib/validators';

// =============================================================================
// Types
// =============================================================================

/**
 * Extended result type for useChallengeForm hook
 * Includes derived state for conditional UI rendering
 */
export type UseChallengeFormResult = UseFormReturn<ChallengeFormSchema> & {
  /** Current submission type value */
  submissionType: ChallengeSubmissionType;
  /** Whether current scoring category is PEER_VOTING */
  isPeerVoting: boolean;
  /** Whether current scoring category is JUDGED_STAFF */
  isJudgedStaff: boolean;
  /** Whether isRecurring is enabled */
  isRecurring: boolean;
  /** Whether auto-approve is enabled */
  autoApprove: boolean;
  /** Whether this is a location-based challenge */
  isLocationBased: boolean;
  /** Whether this is a QR code challenge */
  isQRCode: boolean;
  /** Whether this is a text challenge */
  isText: boolean;
  /** Whether form can be submitted */
  canSubmit: boolean;
  /** Helper to reset form with default values */
  resetToDefaults: () => void;
};

/**
 * Default values for challenge form
 */
const DEFAULT_VALUES: ChallengeFormSchema = {
  name: '',
  description: '',
  image: '',
  submissionType: 'IMAGE',
  scoringCategory: 'SPEED',
  isRecurring: false,
  recurringDays: 7,
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
  basePoints: 10,
  status: 'HIDDEN',
  autoApprove: false,
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Custom hook for challenge form management with complex validation.
 *
 * Features:
 * - Full integration with react-hook-form
 * - Complex validation via challengeFormSchema (Zod)
 * - Derived state for conditional UI rendering
 * - Default values optimized for common use cases
 * - Type-safe form data
 *
 * @param initialValues - Optional initial values to override defaults
 * @returns Extended form state with derived values
 *
 * @example
 * ```tsx
 * function ChallengeForm() {
 *   const {
 *     register,
 *     handleSubmit,
 *     formState: { errors },
 *     isPeerVoting,
 *     isRecurring,
 *   } = useChallengeForm();
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('name')} />
 *       {errors.name && <span>{errors.name.message}</span>}
 *
 *       {isPeerVoting && (
 *         <div>
 *           <input {...register('votingDurationHours')} />
 *         </div>
 *       )}
 *     </form>
 *   );
 * }
 * ```
 */
export function useChallengeForm(
  initialValues?: Partial<ChallengeFormSchema>,
): UseChallengeFormResult {
  // Merge default values with any provided initial values
  const defaultValues = useMemo(
    () => ({
      ...DEFAULT_VALUES,
      ...initialValues,
    }),
    [initialValues],
  );

  // Initialize react-hook-form with Zod resolver
  const form = useForm<ChallengeFormSchema>({
    resolver: zodResolver(challengeFormSchema),
    mode: 'onBlur', // Validate on blur for immediate feedback
    defaultValues,
  });

  const {
    watch,
    formState: { isValid, isDirty },
    reset,
  } = form;

  // Watch key fields for conditional rendering
  const submissionType = watch('submissionType');
  const scoringCategory = watch('scoringCategory');
  const isRecurring = watch('isRecurring') ?? false;
  const autoApprove = watch('autoApprove') ?? false;

  // Derived state for conditional UI rendering
  const isPeerVoting = scoringCategory === 'PEER_VOTING';
  const isJudgedStaff = scoringCategory === 'JUDGED_STAFF';
  const isLocationBased =
    submissionType === 'LOCATION' || submissionType === 'IMAGE_LOCATION';
  const isQRCode = submissionType === 'QR_CODE';
  const isText = submissionType === 'TEXT';

  // Can submit when form is valid, dirty, and not submitting
  const canSubmit = isValid && isDirty;

  // Reset helper that clears back to defaults
  const resetToDefaults = useCallback(() => {
    reset(DEFAULT_VALUES);
  }, [reset]);

  // Return extended form state
  return {
    ...form,
    submissionType,
    isPeerVoting,
    isJudgedStaff,
    isRecurring,
    autoApprove,
    isLocationBased,
    isQRCode,
    isText,
    canSubmit,
    resetToDefaults,
  };
}

// =============================================================================
// Helper Types for Form Sections
// =============================================================================

/**
 * Props for challenge basic info section
 */
export interface ChallengeBasicInfoSectionProps {
  register: UseFormReturn<ChallengeFormSchema>['register'];
  errors: UseFormReturn<ChallengeFormSchema>['formState']['errors'];
}

/**
 * Props for challenge type selection section
 */
export interface ChallengeTypeSectionProps {
  register: UseFormReturn<ChallengeFormSchema>['register'];
  setValue: UseFormReturn<ChallengeFormSchema>['setValue'];
  errors: UseFormReturn<ChallengeFormSchema>['formState']['errors'];
  submissionType: ChallengeSubmissionType;
  scoringCategory: ChallengeScoringCategory;
}

/**
 * Props for peer voting configuration section
 */
export interface PeerVotingSectionProps {
  register: UseFormReturn<ChallengeFormSchema>['register'];
  errors: UseFormReturn<ChallengeFormSchema>['formState']['errors'];
  watch: UseFormReturn<ChallengeFormSchema>['watch'];
  setValue: UseFormReturn<ChallengeFormSchema>['setValue'];
}

/**
 * Props for recurring configuration section
 */
export interface RecurringSectionProps {
  register: UseFormReturn<ChallengeFormSchema>['register'];
  errors: UseFormReturn<ChallengeFormSchema>['formState']['errors'];
  isRecurring: boolean;
}

/**
 * Props for location-based configuration section
 */
export interface LocationSectionProps {
  register: UseFormReturn<ChallengeFormSchema>['register'];
  errors: UseFormReturn<ChallengeFormSchema>['formState']['errors'];
}

/**
 * Props for points configuration section
 */
export interface PointsSectionProps {
  register: UseFormReturn<ChallengeFormSchema>['register'];
  errors: UseFormReturn<ChallengeFormSchema>['formState']['errors'];
  scoringCategory: ChallengeScoringCategory;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format time string (HH:mm) for display
 */
export function formatTimeDisplay(timeString: string | undefined): string {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':').map(Number);
  if (hours == null || minutes == null) return timeString;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate voting end time based on duration
 */
export function calculateVotingEndTime(
  challengeEndTime: Date | undefined,
  durationHours: number | undefined,
): Date | undefined {
  if (!challengeEndTime || !durationHours) return undefined;

  const endTime = new Date(challengeEndTime);
  endTime.setHours(endTime.getHours() + durationHours);
  return endTime;
}

/**
 * Validate that daily times make sense
 */
export function validateDailyTimeRange(
  startTime: string | undefined,
  endTime: string | undefined,
): { valid: boolean; error?: string } {
  if (!startTime || !endTime) {
    return { valid: true }; // Let schema validation handle required fields
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return { valid: true }; // Let schema validation handle format
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
  const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);

  if (startMinutes >= endMinutes) {
    return {
      valid: false,
      error: 'Start time must be before end time',
    };
  }

  return { valid: true };
}

/**
 * Get human-readable label for submission type
 */
export function getSubmissionTypeLabel(type: ChallengeSubmissionType): string {
  const labels: Record<ChallengeSubmissionType, string> = {
    IMAGE: 'Single Image',
    MULTI_IMAGE: 'Multiple Images',
    VIDEO: 'Video',
    TEXT: 'Text Response',
    IMAGE_LOCATION: 'Image + Location',
    LOCATION: 'Location Only',
    QR_CODE: 'QR Code Scan',
  };
  return labels[type] ?? type;
}

/**
 * Get human-readable label for scoring category
 */
export function getScoringCategoryLabel(
  category: ChallengeScoringCategory,
): string {
  const labels: Record<ChallengeScoringCategory, string> = {
    SPEED: 'Speed (First Completion)',
    UNLIMITED: 'Unlimited (Everyone Gets Points)',
    JUDGED_STAFF: 'Staff Judged',
    PEER_VOTING: 'Peer Voting',
  };
  return labels[category] ?? category;
}

/**
 * Get description for submission type
 */
export function getSubmissionTypeDescription(
  type: ChallengeSubmissionType,
): string {
  const descriptions: Record<ChallengeSubmissionType, string> = {
    IMAGE: 'Participants submit a single photo',
    MULTI_IMAGE: 'Participants submit multiple photos',
    VIDEO: 'Participants submit a video',
    TEXT: 'Participants submit a text response',
    IMAGE_LOCATION: 'Participants submit a photo with GPS location verification',
    LOCATION: 'Participants verify location with GPS only',
    QR_CODE: 'Participants scan a QR code to complete',
  };
  return descriptions[type] ?? '';
}
