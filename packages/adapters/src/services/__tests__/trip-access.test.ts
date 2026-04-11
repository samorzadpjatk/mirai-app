import { describe, it, expect, mock, beforeEach } from "bun:test";
import { TripAccessService } from "../trip-access";
import type {
  TripRepository,
  ParticipantRepository,
} from "@mirai-app/use-cases";
import type { Trip, Participant } from "@mirai-app/domain";

// Mock domain objects
const createMockTrip = (overrides?: Partial<Trip>): Trip =>
  ({
    id: "trip-123",
    name: "Test Trip",
    endDate: new Date("2024-12-31"),
    hasEnded: () => false,
    ...overrides,
  }) as Trip;

const createMockParticipant = (overrides?: Partial<Participant>): Participant =>
  ({
    id: "participant-123",
    userId: "user-123",
    tripId: "trip-123",
    groupId: "group-123",
    role: "PARTICIPANT",
    isGroupLeader: () => false,
    isStaff: () => false,
    ...overrides,
  }) as Participant;

describe("[UNIT] TripAccessService", () => {
  let service: TripAccessService;
  let mockTripRepository: TripRepository;
  let mockParticipantRepository: ParticipantRepository;

  beforeEach(() => {
    mockTripRepository = {
      findById: mock(() => Promise.resolve(createMockTrip())),
    } as unknown as TripRepository;

    mockParticipantRepository = {
      findByUserAndTrip: mock(() => Promise.resolve(createMockParticipant())),
    } as unknown as ParticipantRepository;

    service = new TripAccessService(
      mockTripRepository,
      mockParticipantRepository,
    );
  });

  describe("isGroupLeader", () => {
    it("should return true for group leader", async () => {
      mockParticipantRepository.findByUserAndTrip = mock(() =>
        Promise.resolve(
          createMockParticipant({
            role: "GROUP_LEADER",
            isGroupLeader: () => true,
          }),
        ),
      );

      const result = await service.isGroupLeader("user-123", "trip-123");

      expect(result.isLeader).toBe(true);
      expect(result.groupId).toBe("group-123");
    });

    it("should return false when user has no participant record", async () => {
      mockParticipantRepository.findByUserAndTrip = mock(() =>
        Promise.resolve(null),
      );

      const result = await service.isGroupLeader("user-123", "trip-123");

      expect(result.isLeader).toBe(false);
    });

    it("should return false for regular participant", async () => {
      mockParticipantRepository.findByUserAndTrip = mock(() =>
        Promise.resolve(createMockParticipant({ role: "PARTICIPANT" })),
      );

      const result = await service.isGroupLeader("user-123", "trip-123");

      expect(result.isLeader).toBe(false);
    });
  });

  describe("isStaff", () => {
    it("should return true for admin", async () => {
      mockParticipantRepository.findByUserAndTrip = mock(() =>
        Promise.resolve(
          createMockParticipant({
            role: "ADMIN",
            isStaff: () => true,
          }),
        ),
      );

      const result = await service.isStaff("user-123");

      expect(result).toBe(true);
    });

    it("should return true for moderator", async () => {
      mockParticipantRepository.findByUserAndTrip = mock(() =>
        Promise.resolve(
          createMockParticipant({
            role: "MODERATOR",
            isStaff: () => true,
          }),
        ),
      );

      const result = await service.isStaff("user-123");

      expect(result).toBe(true);
    });

    it("should return false for regular participant", async () => {
      const result = await service.isStaff("user-123");

      expect(result).toBe(false);
    });
  });

  describe("hasTripEnded", () => {
    it("should return false for active trip", async () => {
      const result = await service.hasTripEnded("trip-123");

      expect(result).toBe(false);
    });

    it("should return true for ended trip", async () => {
      mockTripRepository.findById = mock(() =>
        Promise.resolve(
          createMockTrip({
            endDate: new Date("2020-01-01"),
            hasEnded: () => true,
          }),
        ),
      );

      const result = await service.hasTripEnded("trip-123");

      expect(result).toBe(true);
    });

    it("should return false when trip not found", async () => {
      mockTripRepository.findById = mock(() => Promise.resolve(null));

      const result = await service.hasTripEnded("trip-123");

      expect(result).toBe(false);
    });
  });
});
