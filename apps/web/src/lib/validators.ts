/**
 * Shared Validation Schemas
 *
 * Centralized Zod schemas for form validation across all admin pages.
 * These schemas follow the domain constraints and provide consistent
 * validation messages.
 *
 * ## Usage
 *
 * ```typescript
 * import { createUserSchema, createGroupSchema, challengeFormSchema } from '@/lib/validators';
 * import { zodResolver } from '@hookform/resolvers/zod';
 *
 * const form = useForm({
 *   resolver: zodResolver(createUserSchema),
 *   defaultValues: { firstName: '', lastName: '', email: '' },
 * });
 * ```
 *
 * @module @mirai-app/web/lib/validators
 */

import { z } from 'zod';

// =============================================================================
// Common Validation Helpers
// =============================================================================

/**
 * Email validation regex - standard email format
 */
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * UUID validation regex
 */
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// =============================================================================
// User Validation Schemas
// =============================================================================

/**
 * Input type for creating a user
 */
export interface CreateUserInput {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's email address */
  email: string;
}

/**
 * Input type for updating a user
 */
export interface UpdateUserInput extends Partial<CreateUserInput> {
  /** User ID to update */
  id: string;
}

/**
 * Zod schema for creating a user
 * Validates first name, last name, and email
 */
export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .regex(emailRegex, 'Please enter a valid email address')
    .trim()
    .toLowerCase(),
});

/**
 * Zod schema for updating a user
 * All fields are optional except id
 */
export const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  firstName: z
    .string()
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name must be less than 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must be less than 50 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .regex(emailRegex, 'Please enter a valid email address')
    .trim()
    .toLowerCase()
    .optional(),
});

/**
 * Inferred type from createUserSchema
 */
export type CreateUserSchema = z.infer<typeof createUserSchema>;

/**
 * Inferred type from updateUserSchema
 */
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

// =============================================================================
// Group Validation Schemas
// =============================================================================

/**
 * Input type for creating a group
 */
export interface CreateGroupInput {
  /** Group name */
  name: string;
}

/**
 * Input type for updating a group
 */
export interface UpdateGroupInput extends Partial<CreateGroupInput> {
  /** Group ID to update */
  id: string;
}

/**
 * Zod schema for creating a group
 * Validates name (required, 1-100 characters)
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters')
    .trim(),
});

/**
 * Zod schema for updating a group
 * All fields are optional except id
 */
export const updateGroupSchema = z.object({
  id: z.string().min(1, 'Group ID is required'),
  name: z
    .string()
    .min(1, 'Group name must be at least 1 character')
    .max(100, 'Group name must be less than 100 characters')
    .trim()
    .optional(),
});

/**
 * Inferred type from createGroupSchema
 */
export type CreateGroupSchema = z.infer<typeof createGroupSchema>;

/**
 * Inferred type from updateGroupSchema
 */
export type UpdateGroupSchema = z.infer<typeof updateGroupSchema>;

// =============================================================================
// Challenge Validation Schemas
// =============================================================================

/**
 * Challenge submission types
 */
export type ChallengeSubmissionType =
  | 'IMAGE'
  | 'MULTI_IMAGE'
  | 'VIDEO'
  | 'TEXT'
  | 'IMAGE_LOCATION'
  | 'LOCATION'
  | 'QR_CODE';

/**
 * Challenge scoring categories
 */
export type ChallengeScoringCategory =
  | 'SPEED'
  | 'UNLIMITED'
  | 'JUDGED_STAFF'
  | 'PEER_VOTING';

/**
 * Challenge statuses
 */
export type ChallengeStatus =
  | 'HIDDEN'
  | 'VISIBLE'
  | 'ACTIVE'
  | 'VOTING_PHASE'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Input type for challenge form
 */
export interface ChallengeFormInput {
  /** Challenge name */
  name: string;
  /** Challenge description */
  description?: string;
  /** Challenge image URL */
  image?: string;
  /** Submission type */
  submissionType: ChallengeSubmissionType;
  /** Scoring category */
  scoringCategory: ChallengeScoringCategory;
  /** Whether challenge is recurring */
  isRecurring?: boolean;
  /** Number of days for recurring challenge */
  recurringDays?: number;
  /** Daily start time (HH:mm format) */
  dailyStartTime?: string;
  /** Daily end time (HH:mm format) */
  dailyEndTime?: string;
  /** Base points for completing challenge */
  basePoints?: number;
  /** Points for first place (optional) */
  firstPlacePoints?: number;
  /** Points for second place (optional) */
  secondPlacePoints?: number;
  /** Points for third place (optional) */
  thirdPlacePoints?: number;
  /** Initial status */
  status?: 'HIDDEN' | 'VISIBLE';
  /** Challenge start time */
  startTime?: Date;
  /** Challenge end time */
  endTime?: Date;
  /** Voting duration in hours (for peer voting) */
  votingDurationHours?: number;
  /** Voting start time (for peer voting) */
  votingStartTime?: Date;
  /** Voting end time (for peer voting) */
  votingEndTime?: Date;
  /** Target latitude (for location-based challenges) */
  targetLatitude?: number;
  /** Target longitude (for location-based challenges) */
  targetLongitude?: number;
  /** QR code expected value */
  qrCodeValue?: string;
  /** Text expected phrase (for auto-approve text challenges) */
  textExpectedPhrase?: string;
  /** Whether to auto-approve submissions */
  autoApprove?: boolean;
}

/**
 * Time format regex (HH:mm)
 */
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Maximum recurring days
 */
const MAX_RECURRING_DAYS = 30;

/**
 * Maximum peer voting duration in hours (30 days)
 */
const MAX_PEER_VOTING_DURATION_HOURS = 24 * 30;

/**
 * Zod schema for challenge form validation
 * Handles complex validation for peer voting and recurring configurations
 */
export const challengeFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Challenge name is required')
      .max(100, 'Challenge name must be less than 100 characters')
      .trim(),
    description: z
      .string()
      .max(2000, 'Description must be less than 2000 characters')
      .optional(),
    image: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),
    submissionType: z.enum([
      'IMAGE',
      'MULTI_IMAGE',
      'VIDEO',
      'TEXT',
      'IMAGE_LOCATION',
      'LOCATION',
      'QR_CODE',
    ]),
    scoringCategory: z.enum([
      'SPEED',
      'UNLIMITED',
      'JUDGED_STAFF',
      'PEER_VOTING',
    ]),
    isRecurring: z.boolean().optional(),
    recurringDays: z
      .number()
      .int('Recurring days must be a whole number')
      .min(1, 'Recurring days must be at least 1')
      .max(
        MAX_RECURRING_DAYS,
        `Recurring days must be at most ${MAX_RECURRING_DAYS}`,
      )
      .optional(),
    dailyStartTime: z
      .string()
      .regex(timeFormatRegex, 'Time must be in HH:mm format')
      .optional(),
    dailyEndTime: z
      .string()
      .regex(timeFormatRegex, 'Time must be in HH:mm format')
      .optional(),
    basePoints: z
      .number()
      .int('Points must be a whole number')
      .min(0, 'Points cannot be negative')
      .optional(),
    firstPlacePoints: z
      .number()
      .int('Points must be a whole number')
      .min(0, 'Points cannot be negative')
      .optional(),
    secondPlacePoints: z
      .number()
      .int('Points must be a whole number')
      .min(0, 'Points cannot be negative')
      .optional(),
    thirdPlacePoints: z
      .number()
      .int('Points must be a whole number')
      .min(0, 'Points cannot be negative')
      .optional(),
    status: z.enum(['HIDDEN', 'VISIBLE']).optional(),
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    votingDurationHours: z
      .number()
      .int('Duration must be a whole number')
      .min(1, 'Duration must be at least 1 hour')
      .max(
        MAX_PEER_VOTING_DURATION_HOURS,
        `Duration must be at most ${MAX_PEER_VOTING_DURATION_HOURS} hours`,
      )
      .optional(),
    votingStartTime: z.date().optional(),
    votingEndTime: z.date().optional(),
    targetLatitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional(),
    targetLongitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional(),
    qrCodeValue: z.string().optional(),
    textExpectedPhrase: z.string().optional(),
    autoApprove: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate peer voting configuration
    if (data.scoringCategory === 'PEER_VOTING') {
      // Peer voting only supports IMAGE or VIDEO submission types
      if (data.submissionType !== 'IMAGE' && data.submissionType !== 'VIDEO') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Peer voting is only supported for IMAGE or VIDEO challenges',
          path: ['submissionType'],
        });
      }

      // Peer voting requires end time
      if (!data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Peer voting challenge requires a submission end time',
          path: ['endTime'],
        });
      }

      // Peer voting requires either duration or voting window
      const hasDuration =
        data.votingDurationHours != null &&
        Number.isInteger(data.votingDurationHours) &&
        data.votingDurationHours > 0;
      const hasWindow = data.votingStartTime && data.votingEndTime;

      if (!hasDuration && !hasWindow) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Peer voting requires either voting duration or voting start/end times',
          path: ['votingDurationHours'],
        });
      }
    }

    // Validate recurring configuration
    if (data.isRecurring) {
      // Recurring challenges cannot be peer voting
      if (data.scoringCategory === 'PEER_VOTING') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurring peer voting challenges are not supported',
          path: ['scoringCategory'],
        });
      }

      // Recurring requires daily start and end times
      if (!data.dailyStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurring challenge requires daily start time',
          path: ['dailyStartTime'],
        });
      }

      if (!data.dailyEndTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurring challenge requires daily end time',
          path: ['dailyEndTime'],
        });
      }

      // Recurring requires days count
      if (
        !data.recurringDays ||
        data.recurringDays < 1 ||
        data.recurringDays > MAX_RECURRING_DAYS
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Recurring days must be between 1 and ${MAX_RECURRING_DAYS}`,
          path: ['recurringDays'],
        });
      }

      // Validate daily start time is before end time
      if (data.dailyStartTime && data.dailyEndTime) {
        const [startHour, startMin] = data.dailyStartTime.split(':').map(Number);
        const [endHour, endMin] = data.dailyEndTime.split(':').map(Number);
        const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
        const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);

        if (startMinutes >= endMinutes) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Daily start time must be before daily end time',
            path: ['dailyStartTime'],
          });
        }
      }
    }

    // Validate auto-approve rules
    if (data.submissionType === 'IMAGE_LOCATION' && data.autoApprove) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Image + Location challenges cannot use auto-approve',
        path: ['autoApprove'],
      });
    }

    if (
      data.submissionType === 'TEXT' &&
      data.autoApprove &&
      !data.textExpectedPhrase?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Text auto-approve requires an expected phrase',
        path: ['textExpectedPhrase'],
      });
    }

    // Validate QR code challenges have expected value
    if (data.submissionType === 'QR_CODE' && !data.qrCodeValue?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'QR Code challenge requires an expected value',
        path: ['qrCodeValue'],
      });
    }

    // Validate location challenges have coordinates
    if (data.submissionType === 'LOCATION' || data.submissionType === 'IMAGE_LOCATION') {
      if (data.targetLatitude == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location challenge requires target latitude',
          path: ['targetLatitude'],
        });
      }
      if (data.targetLongitude == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location challenge requires target longitude',
          path: ['targetLongitude'],
        });
      }
    }

    // Validate voting end is after voting start
    if (data.votingStartTime && data.votingEndTime) {
      if (data.votingEndTime <= data.votingStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Voting end time must be after voting start time',
          path: ['votingEndTime'],
        });
      }
    }

    // Validate challenge end is after start
    if (data.startTime && data.endTime) {
      if (data.endTime <= data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['endTime'],
        });
      }
    }
  });

/**
 * Inferred type from challengeFormSchema
 */
export type ChallengeFormSchema = z.infer<typeof challengeFormSchema>;

// =============================================================================
// Judgement Validation Schemas
// =============================================================================

/**
 * Input type for submitting a judgement
 */
export interface JudgementInput {
  /** Submission ID being judged */
  submissionId: string;
  /** Score assigned (1-5 or points) */
  score: number;
  /** Optional feedback comment */
  feedback?: string;
}

/**
 * Zod schema for judgement validation
 */
export const judgementSchema = z.object({
  submissionId: z
    .string()
    .min(1, 'Submission ID is required')
    .regex(uuidRegex, 'Invalid submission ID format'),
  score: z
    .number()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score cannot exceed 100'),
  feedback: z
    .string()
    .max(500, 'Feedback must be less than 500 characters')
    .optional(),
});

/**
 * Inferred type from judgementSchema
 */
export type JudgementSchema = z.infer<typeof judgementSchema>;

// =============================================================================
// Reward Validation Schemas
// =============================================================================

/**
 * Input type for creating a reward
 */
export interface CreateRewardInput {
  /** Reward name */
  name: string;
  /** Reward description */
  description?: string;
  /** Reward image URL */
  image?: string;
  /** Cost in coins */
  cost: number;
  /** Quantity available (null for unlimited) */
  quantity?: number | null;
}

/**
 * Zod schema for reward creation
 */
export const createRewardSchema = z.object({
  name: z
    .string()
    .min(1, 'Reward name is required')
    .max(100, 'Reward name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  image: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  cost: z
    .number()
    .int('Cost must be a whole number')
    .min(0, 'Cost cannot be negative'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .nullable()
    .optional(),
});

/**
 * Inferred type from createRewardSchema
 */
export type CreateRewardSchema = z.infer<typeof createRewardSchema>;

// =============================================================================
// Notification Validation Schemas
// =============================================================================

/**
 * Input type for creating a notification
 */
export interface CreateNotificationInput {
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Target user IDs (empty for all users) */
  targetUserIds?: string[];
  /** Target group IDs (empty for all groups) */
  targetGroupIds?: string[];
}

/**
 * Zod schema for notification creation
 */
export const createNotificationSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters')
    .trim(),
  targetUserIds: z.array(z.string()).optional(),
  targetGroupIds: z.array(z.string()).optional(),
});

/**
 * Inferred type from createNotificationSchema
 */
export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>;

// =============================================================================
// Coin Operation Validation Schemas
// =============================================================================

/**
 * Input type for coin operations
 */
export interface CoinOperationInput {
  /** Target group ID */
  groupId: string;
  /** Amount to add (positive) or remove (negative) */
  amount: number;
  /** Reason for the operation */
  reason: string;
}

/**
 * Zod schema for coin operations
 */
export const coinOperationSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  amount: z
    .number()
    .int('Amount must be a whole number')
    .refine((val) => val !== 0, 'Amount cannot be zero'),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(200, 'Reason must be less than 200 characters')
    .trim(),
});

/**
 * Inferred type from coinOperationSchema
 */
export type CoinOperationSchema = z.infer<typeof coinOperationSchema>;
