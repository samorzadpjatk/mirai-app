import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import {
  LocationSharingRequest,
  LocationSharingRequestStatus,
} from "./LocationSharingRequest";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

describe("[UNIT] LocationSharingRequest Entity", () => {
  describe("LocationSharingRequest.create", () => {
    it("should create with valid data", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.id).toBeDefined();
      expect(request.senderId).toBe("user-123");
      expect(request.receiverId).toBe("user-456");
      expect(request.status).toBe(LocationSharingRequestStatus.PENDING);
      expect(request.isPending()).toBe(true);
    });

    it("should create with accepted status", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
        status: LocationSharingRequestStatus.ACCEPTED,
      });

      const request = Effect.runSync(effect);
      expect(request.status).toBe(LocationSharingRequestStatus.ACCEPTED);
      expect(request.isAccepted()).toBe(true);
    });

    it("should reject empty senderId", () => {
      const effect = LocationSharingRequest.create({
        senderId: "",
        receiverId: "user-456",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("senderId");
      }
    });

    it("should reject empty receiverId", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("receiverId");
      }
    });

    it("should reject same sender and receiver", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("receiverId");
      }
    });
  });

  describe("LocationSharingRequest.accept", () => {
    it("should accept request", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      const acceptedEffect = request.accept();

      const accepted = Effect.runSync(acceptedEffect);
      expect(accepted.status).toBe(LocationSharingRequestStatus.ACCEPTED);
      expect(accepted.isAccepted()).toBe(true);
      expect(accepted.isPending()).toBe(false);
      expect(accepted.isResolved()).toBe(true);
    });

    it("should reject accepting already accepted request", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
        status: LocationSharingRequestStatus.ACCEPTED,
      });

      const request = Effect.runSync(effect);
      const acceptedEffect = request.accept();

      const exit = Effect.runSyncExit(acceptedEffect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });

    it("should reject accepting already rejected request", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
        status: LocationSharingRequestStatus.REJECTED,
      });

      const request = Effect.runSync(effect);
      const acceptedEffect = request.accept();

      const exit = Effect.runSyncExit(acceptedEffect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("LocationSharingRequest.reject", () => {
    it("should reject request", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      const rejectedEffect = request.reject();

      const rejected = Effect.runSync(rejectedEffect);
      expect(rejected.status).toBe(LocationSharingRequestStatus.REJECTED);
      expect(rejected.isRejected()).toBe(true);
      expect(rejected.isPending()).toBe(false);
      expect(rejected.isResolved()).toBe(true);
    });

    it("should reject rejecting already accepted request", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
        status: LocationSharingRequestStatus.ACCEPTED,
      });

      const request = Effect.runSync(effect);
      const rejectedEffect = request.reject();

      const exit = Effect.runSyncExit(rejectedEffect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("LocationSharingRequest.involvesUser", () => {
    it("should check if involves sender", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.involvesUser("user-123")).toBe(true);
    });

    it("should check if involves receiver", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.involvesUser("user-456")).toBe(true);
    });

    it("should return false for unrelated user", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.involvesUser("user-789")).toBe(false);
    });
  });

  describe("LocationSharingRequest.isFromUser / isToUser", () => {
    it("should identify sender", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.isFromUser("user-123")).toBe(true);
      expect(request.isFromUser("user-456")).toBe(false);
    });

    it("should identify receiver", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.isToUser("user-456")).toBe(true);
      expect(request.isToUser("user-123")).toBe(false);
    });
  });

  describe("LocationSharingRequest.getOtherParty", () => {
    it("should return receiver when given sender", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.getOtherParty("user-123")).toBe("user-456");
    });

    it("should return sender when given receiver", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.getOtherParty("user-456")).toBe("user-123");
    });

    it("should return null for unrelated user", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.getOtherParty("user-789")).toBeNull();
    });
  });

  describe("LocationSharingRequest.getUniqueKey", () => {
    it("should return composite key", () => {
      const effect = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      const request = Effect.runSync(effect);
      expect(request.getUniqueKey()).toBe("user-123:user-456");
    });
  });
});
