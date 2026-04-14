/**
 * Example: Using Mock Factories in Tests
 *
 * BEFORE (repetitive):
 * ```typescript
 * const userId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
 * const adminId = UserId.create("550e8400-e29b-41d4-a716-446655440010");
 * const tripId = TripId.create("550e8400-e29b-41d4-a716-446655440100");
 * ```
 *
 * AFTER (clean):
 * ```typescript
 * import { Mocks } from "@mirai-app/domain";
 *
 * const user = Mocks.user();
 * const admin = Mocks.admin();
 * const trip = Mocks.trip();
 * ```
 */

import { describe, it, expect } from "bun:test";
import { Mocks, TestIds } from "../../index";

describe("[UNIT] Mock Factories", () => {
  it("should create user with default values", () => {
    const user = Mocks.user();

    expect(user.email).toBe("user@example.com");
    expect(user.name).toBe("Test User");
    // ID is a branded type
    expect(typeof user.id).toBe("string");
  });

  it("should create user with custom email", () => {
    const user = Mocks.user({ email: "custom@example.com" });

    expect(user.email).toBe("custom@example.com");
  });

  it("should create admin with admin role", () => {
    const admin = Mocks.admin();

    expect(admin.role).toBe("ADMIN");
    expect(admin.email).toBe("admin@example.com");
  });

  it("should create moderator with moderator role", () => {
    const moderator = Mocks.moderator();

    expect(moderator.role).toBe("MODERATOR");
  });

  it("should create multiple users with sequential IDs", () => {
    const users = Mocks.users(3);

    expect(users).toHaveLength(3);
    expect(users[0].email).toBe("user1@example.com");
    expect(users[1].email).toBe("user2@example.com");
    expect(users[2].email).toBe("user3@example.com");
  });

  it("should create trip with default values", () => {
    const trip = Mocks.trip();

    expect(trip.name).toBe("Test Trip");
    expect(trip.createdAt).toBeInstanceOf(Date);
  });

  it("should provide quick ID shortcuts", () => {
    const userId = Mocks.userId();
    const adminId = Mocks.adminId();
    const tripId = Mocks.tripId();

    expect(typeof userId).toBe("string");
    expect(typeof adminId).toBe("string");
    expect(typeof tripId).toBe("string");

    // Uses TestIds constants
    expect(userId).toBe(TestIds.USER);
    expect(adminId).toBe(TestIds.ADMIN);
    expect(tripId).toBe(TestIds.TRIP);
  });
});
