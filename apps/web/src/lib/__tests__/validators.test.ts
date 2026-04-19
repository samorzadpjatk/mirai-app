/**
 * Validators Tests
 *
 * Tests for Zod validation schemas including:
 * - User creation and update validation
 * - Group creation and update validation
 * - Challenge form validation with complex rules
 * - Reward creation validation
 * - Notification creation validation
 * - Coin operation validation
 * - Judgement validation
 *
 * @module @/lib/__tests__/validators.test
 */

import { describe, it, expect } from 'vitest';
import {
  createUserSchema,
  updateUserSchema,
  createGroupSchema,
  updateGroupSchema,
  challengeFormSchema,
  createRewardSchema,
  createNotificationSchema,
  coinOperationSchema,
  judgementSchema,
} from '../validators';

describe('[UNIT] Validators', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty first name', () => {
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues[0]?.message).toContain('First name is required');
      }
    });

    it('should reject empty last name', () => {
      const invalidData = {
        firstName: 'John',
        lastName: '',
        email: 'john.doe@example.com',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues[0]?.message).toContain('Last name is required');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject first name over 50 characters', () => {
      const invalidData = {
        firstName: 'a'.repeat(51),
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from names', () => {
      const dataWithWhitespace = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: 'john.doe@example.com',
      };

      const result = createUserSchema.parse(dataWithWhitespace);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should convert email to lowercase', () => {
      const dataWithUppercaseEmail = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN.DOE@EXAMPLE.COM',
      };

      const result = createUserSchema.parse(dataWithUppercaseEmail);
      expect(result.email).toBe('john.doe@example.com');
    });
  });

  describe('updateUserSchema', () => {
    it('should validate update with all fields', () => {
      const validData = {
        id: 'user-123',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate update with only required id', () => {
      const validData = {
        id: 'user-123',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const invalidData = {
        firstName: 'Jane',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty optional fields', () => {
      const invalidData = {
        id: 'user-123',
        firstName: '',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createGroupSchema', () => {
    it('should validate valid group data', () => {
      const validData = {
        name: 'Team Alpha',
      };

      const result = createGroupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty group name', () => {
      const invalidData = {
        name: '',
      };

      const result = createGroupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const invalidData = {
        name: 'a'.repeat(101),
      };

      const result = createGroupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from name', () => {
      const dataWithWhitespace = {
        name: '  Team Alpha  ',
      };

      const result = createGroupSchema.parse(dataWithWhitespace);
      expect(result.name).toBe('Team Alpha');
    });
  });

  describe('updateGroupSchema', () => {
    it('should validate update with id and name', () => {
      const validData = {
        id: 'group-123',
        name: 'Updated Team',
      };

      const result = updateGroupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate update with only id', () => {
      const validData = {
        id: 'group-123',
      };

      const result = updateGroupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const invalidData = {
        name: 'Updated Team',
      };

      const result = updateGroupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('challengeFormSchema', () => {
    it('should validate basic challenge', () => {
      const validData = {
        name: 'Photo Challenge',
        submissionType: 'IMAGE' as const,
        scoringCategory: 'SPEED' as const,
      };

      const result = challengeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate challenge with all fields', () => {
      const validData = {
        name: 'Complete Challenge',
        description: 'A detailed description',
        image: 'https://example.com/image.jpg',
        submissionType: 'IMAGE' as const,
        scoringCategory: 'JUDGED_STAFF' as const,
        basePoints: 100,
        firstPlacePoints: 50,
        secondPlacePoints: 30,
        thirdPlacePoints: 20,
        status: 'VISIBLE' as const,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
      };

      const result = challengeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty challenge name', () => {
      const invalidData = {
        name: '',
        submissionType: 'IMAGE',
        scoringCategory: 'SPEED',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        submissionType: 'IMAGE',
        scoringCategory: 'SPEED',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid submission type', () => {
      const invalidData = {
        name: 'Test Challenge',
        submissionType: 'INVALID_TYPE',
        scoringCategory: 'SPEED',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate peer voting with IMAGE submission', () => {
      const validData = {
        name: 'Peer Voting Challenge',
        submissionType: 'IMAGE' as const,
        scoringCategory: 'PEER_VOTING' as const,
        endTime: new Date(Date.now() + 86400000),
        votingDurationHours: 24,
      };

      const result = challengeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate peer voting with VIDEO submission', () => {
      const validData = {
        name: 'Video Voting Challenge',
        submissionType: 'VIDEO' as const,
        scoringCategory: 'PEER_VOTING' as const,
        endTime: new Date(Date.now() + 86400000),
        votingStartTime: new Date(),
        votingEndTime: new Date(Date.now() + 86400000),
      };

      const result = challengeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject peer voting with TEXT submission', () => {
      const invalidData = {
        name: 'Invalid Peer Challenge',
        submissionType: 'TEXT' as const,
        scoringCategory: 'PEER_VOTING' as const,
        endTime: new Date(Date.now() + 86400000),
        votingDurationHours: 24,
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject peer voting without end time', () => {
      const invalidData = {
        name: 'Invalid Peer Challenge',
        submissionType: 'IMAGE',
        scoringCategory: 'PEER_VOTING',
        votingDurationHours: 24,
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject peer voting without voting duration or window', () => {
      const invalidData = {
        name: 'Invalid Peer Challenge',
        submissionType: 'IMAGE',
        scoringCategory: 'PEER_VOTING',
        endTime: new Date(Date.now() + 86400000),
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate recurring challenge', () => {
      const validData = {
        name: 'Daily Challenge',
        submissionType: 'IMAGE' as const,
        scoringCategory: 'SPEED' as const,
        isRecurring: true,
        recurringDays: 7,
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
      };

      const result = challengeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject recurring peer voting challenge', () => {
      const invalidData = {
        name: 'Invalid Recurring',
        submissionType: 'IMAGE',
        scoringCategory: 'PEER_VOTING',
        isRecurring: true,
        recurringDays: 7,
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
        endTime: new Date(Date.now() + 86400000),
        votingDurationHours: 24,
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject recurring without daily start time', () => {
      const invalidData = {
        name: 'Invalid Recurring',
        submissionType: 'IMAGE',
        scoringCategory: 'SPEED',
        isRecurring: true,
        recurringDays: 7,
        dailyEndTime: '17:00',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject recurring without daily end time', () => {
      const invalidData = {
        name: 'Invalid Recurring',
        submissionType: 'IMAGE',
        scoringCategory: 'SPEED',
        isRecurring: true,
        recurringDays: 7,
        dailyStartTime: '09:00',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject recurring days over 30', () => {
      const invalidData = {
        name: 'Invalid Recurring',
        submissionType: 'IMAGE',
        scoringCategory: 'SPEED',
        isRecurring: true,
        recurringDays: 31,
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject recurring days under 1', () => {
      const invalidData = {
        name: 'Invalid Recurring',
        submissionType: 'IMAGE',
        scoringCategory: 'SPEED',
        isRecurring: true,
        recurringDays: 0,
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject daily start time after end time', () => {
      const invalidData = {
        name: 'Invalid Recurring',
        submissionType: 'IMAGE',
        scoringCategory: 'SPEED',
        isRecurring: true,
        recurringDays: 7,
        dailyStartTime: '18:00',
        dailyEndTime: '09:00',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate QR code challenge with expected value', () => {
      const validData = {
        name: 'QR Challenge',
        submissionType: 'QR_CODE' as const,
        scoringCategory: 'SPEED' as const,
        qrCodeValue: 'expected-qr-value',
      };

      const result = challengeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject QR code challenge without expected value', () => {
      const invalidData = {
        name: 'Invalid QR Challenge',
        submissionType: 'QR_CODE',
        scoringCategory: 'SPEED',
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate location challenge with coordinates', () => {
      const validData = {
        name: 'Location Challenge',
        submissionType: 'LOCATION' as const,
        scoringCategory: 'SPEED' as const,
        targetLatitude: 40.7128,
        targetLongitude: -74.006,
      };

      const result = challengeFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject location challenge without latitude', () => {
      const invalidData = {
        name: 'Invalid Location Challenge',
        submissionType: 'LOCATION',
        scoringCategory: 'SPEED',
        targetLongitude: -74.006,
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject location challenge without longitude', () => {
      const invalidData = {
        name: 'Invalid Location Challenge',
        submissionType: 'LOCATION',
        scoringCategory: 'SPEED',
        targetLatitude: 40.7128,
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject latitude outside valid range', () => {
      const invalidData = {
        name: 'Invalid Location Challenge',
        submissionType: 'LOCATION',
        scoringCategory: 'SPEED',
        targetLatitude: 91,
        targetLongitude: -74.006,
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject longitude outside valid range', () => {
      const invalidData = {
        name: 'Invalid Location Challenge',
        submissionType: 'LOCATION',
        scoringCategory: 'SPEED',
        targetLatitude: 40.7128,
        targetLongitude: 181,
      };

      const result = challengeFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createRewardSchema', () => {
    it('should validate valid reward data', () => {
      const validData = {
        name: 'Gold Badge',
        cost: 100,
      };

      const result = createRewardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate reward with all fields', () => {
      const validData = {
        name: 'Complete Reward',
        description: 'A detailed description',
        image: 'https://example.com/reward.jpg',
        cost: 500,
        quantity: 10,
      };

      const result = createRewardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty reward name', () => {
      const invalidData = {
        name: '',
        cost: 100,
      };

      const result = createRewardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative cost', () => {
      const invalidData = {
        name: 'Invalid Reward',
        cost: -10,
      };

      const result = createRewardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer cost', () => {
      const invalidData = {
        name: 'Invalid Reward',
        cost: 100.5,
      };

      const result = createRewardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow null quantity for unlimited', () => {
      const validData = {
        name: 'Unlimited Reward',
        cost: 50,
        quantity: null,
      };

      const result = createRewardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow empty image as empty string', () => {
      const validData = {
        name: 'Reward Without Image',
        cost: 50,
        image: '',
      };

      const result = createRewardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('createNotificationSchema', () => {
    it('should validate valid notification data', () => {
      const validData = {
        title: 'New Challenge',
        message: 'A new challenge is available!',
      };

      const result = createNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate notification with targets', () => {
      const validData = {
        title: 'Targeted Notification',
        message: 'This is for specific users',
        targetUserIds: ['user-1', 'user-2'],
        targetGroupIds: ['group-1'],
      };

      const result = createNotificationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        message: 'Message content',
      };

      const result = createNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty message', () => {
      const invalidData = {
        title: 'Title',
        message: '',
      };

      const result = createNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject title over 100 characters', () => {
      const invalidData = {
        title: 'a'.repeat(101),
        message: 'Valid message',
      };

      const result = createNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject message over 1000 characters', () => {
      const invalidData = {
        title: 'Valid Title',
        message: 'a'.repeat(1001),
      };

      const result = createNotificationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('coinOperationSchema', () => {
    it('should validate valid coin addition', () => {
      const validData = {
        groupId: 'group-123',
        amount: 100,
        reason: 'Winning challenge',
      };

      const result = coinOperationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate valid coin removal', () => {
      const validData = {
        groupId: 'group-123',
        amount: -50,
        reason: 'Purchasing reward',
      };

      const result = coinOperationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const invalidData = {
        groupId: 'group-123',
        amount: 0,
        reason: 'Invalid operation',
      };

      const result = coinOperationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing groupId', () => {
      const invalidData = {
        amount: 100,
        reason: 'Test operation',
      };

      const result = coinOperationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty reason', () => {
      const invalidData = {
        groupId: 'group-123',
        amount: 100,
        reason: '',
      };

      const result = coinOperationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer amount', () => {
      const invalidData = {
        groupId: 'group-123',
        amount: 100.5,
        reason: 'Test operation',
      };

      const result = coinOperationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('judgementSchema', () => {
    it('should validate valid judgement', () => {
      const validData = {
        submissionId: '550e8400-e29b-41d4-a716-446655440000',
        score: 85,
      };

      const result = judgementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate judgement with feedback', () => {
      const validData = {
        submissionId: '550e8400-e29b-41d4-a716-446655440000',
        score: 90,
        feedback: 'Excellent work!',
      };

      const result = judgementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid submission ID format', () => {
      const invalidData = {
        submissionId: 'invalid-id',
        score: 85,
      };

      const result = judgementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative score', () => {
      const invalidData = {
        submissionId: '550e8400-e29b-41d4-a716-446655440000',
        score: -10,
      };

      const result = judgementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject score over 100', () => {
      const invalidData = {
        submissionId: '550e8400-e29b-41d4-a716-446655440000',
        score: 101,
      };

      const result = judgementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject feedback over 500 characters', () => {
      const invalidData = {
        submissionId: '550e8400-e29b-41d4-a716-446655440000',
        score: 85,
        feedback: 'a'.repeat(501),
      };

      const result = judgementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
