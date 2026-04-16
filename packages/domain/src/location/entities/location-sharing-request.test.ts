import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { LocationSharingRequest } from "./location-sharing-request";
import { LocationSharingRequestStatus } from "../../location/enums";
import { ValidationError, StateTransitionError } from "../../system/errors";

describe("[UNIT] LocationSharingRequest", () => {
  describe("create", () => {
    it("creates a valid LocationSharingRequest with minimal required props", async () => {
      const effect = LocationSharingRequest.create({
        senderId: "sender-123",
        receiverId: "receiver-456",
      });

      const request = await Effect.runPromise(effect);

      expect(request.senderId).toBe("sender-123");
      expect(request.receiverId).toBe("receiver-456");
      expect(request.status).toBe(LocationSharingRequestStatus.PENDING);
      expect(request.createdAt).toBeInstanceOf(Date);
      expect(request.updatedAt).toBeInstanceOf(Date);
      expect(request.id).toBeDefined();
    });

    it("creates a LocationSharingRequest with all properties", async () => {
      const createdAt = new Date("2024-01-15T10:00:00Z");
      const updatedAt = new Date("2024-01-15T12:00:00Z");

      const effect = LocationSharingRequest.create({
        id: "request-789",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.PENDING,
        createdAt,
        updatedAt,
      });

      const request = await Effect.runPromise(effect);

      expect(request.id).toBe("request-789");
      expect(request.senderId).toBe("sender-123");
      expect(request.receiverId).toBe("receiver-456");
      expect(request.status).toBe(LocationSharingRequestStatus.PENDING);
      expect(request.createdAt).toEqual(createdAt);
      expect(request.updatedAt).toEqual(updatedAt);
    });

    it("generates a unique id if not provided", async () => {
      const effect1 = LocationSharingRequest.create({
        senderId: "sender-1",
        receiverId: "receiver-a",
      });
      const effect2 = LocationSharingRequest.create({
        senderId: "sender-2",
        receiverId: "receiver-b",
      });

      const req1 = await Effect.runPromise(effect1);
      const req2 = await Effect.runPromise(effect2);

      expect(req1.id).not.toBe(req2.id);
      expect(req1.id).toBeDefined();
      expect(req2.id).toBeDefined();
    });

    it("defaults to PENDING status when not provided", async () => {
      const effect = LocationSharingRequest.create({
        senderId: "sender-123",
        receiverId: "receiver-456",
      });

      const request = await Effect.runPromise(effect);

      expect(request.status).toBe(LocationSharingRequestStatus.PENDING);
      expect(request.isPending()).toBe(true);
    });

    describe("validation", () => {
      it("fails when senderId is empty", async () => {
        const effect = LocationSharingRequest.create({
          senderId: "",
          receiverId: "receiver-456",
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("senderId");
        }
      });

      it("fails when receiverId is empty", async () => {
        const effect = LocationSharingRequest.create({
          senderId: "sender-123",
          receiverId: "",
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("receiverId");
        }
      });

      it("fails when senderId and receiverId are the same", async () => {
        const effect = LocationSharingRequest.create({
          senderId: "same-user",
          receiverId: "same-user",
        });

        const result = await Effect.runPromise(Effect.either(effect));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("receiverId");
          expect(result.left.message).toBe(
            "senderId and receiverId must be different",
          );
        }
      });
    });
  });

  describe("reconstitute", () => {
    it("creates a LocationSharingRequest from existing data without validation", () => {
      const createdAt = new Date("2024-01-15T10:00:00Z");
      const updatedAt = new Date("2024-01-15T12:00:00Z");

      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-456",
        receiverId: "receiver-789",
        status: LocationSharingRequestStatus.ACCEPTED,
        createdAt,
        updatedAt,
      });

      expect(request.id).toBe("request-123");
      expect(request.senderId).toBe("sender-456");
      expect(request.receiverId).toBe("receiver-789");
      expect(request.status).toBe(LocationSharingRequestStatus.ACCEPTED);
      expect(request.createdAt).toEqual(createdAt);
      expect(request.updatedAt).toEqual(updatedAt);
    });

    it("allows reconstituting with same sender and receiver (bypasses validation)", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "same-user",
        receiverId: "same-user",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.senderId).toBe("same-user");
      expect(request.receiverId).toBe("same-user");
    });
  });

  describe("accept", () => {
    it("transitions from PENDING to ACCEPTED", async () => {
      const request = await Effect.runPromise(
        LocationSharingRequest.create({
          senderId: "sender-123",
          receiverId: "receiver-456",
        }),
      );

      const effect = request.accept();
      const accepted = await Effect.runPromise(effect);

      expect(accepted.status).toBe(LocationSharingRequestStatus.ACCEPTED);
      expect(accepted.isAccepted()).toBe(true);
      expect(accepted.isPending()).toBe(false);
      expect(accepted.id).toBe(request.id);
    });

    it("fails when already ACCEPTED", async () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effect = request.accept();
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
        expect(result.left.from).toBe(LocationSharingRequestStatus.ACCEPTED);
        expect(result.left.to).toBe(LocationSharingRequestStatus.ACCEPTED);
        expect(result.left.entityType).toBe("LocationSharingRequest");
      }
    });

    it("fails when already REJECTED", async () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effect = request.accept();
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
        expect(result.left.from).toBe(LocationSharingRequestStatus.REJECTED);
      }
    });
  });

  describe("reject", () => {
    it("transitions from PENDING to REJECTED", async () => {
      const request = await Effect.runPromise(
        LocationSharingRequest.create({
          senderId: "sender-123",
          receiverId: "receiver-456",
        }),
      );

      const effect = request.reject();
      const rejected = await Effect.runPromise(effect);

      expect(rejected.status).toBe(LocationSharingRequestStatus.REJECTED);
      expect(rejected.isRejected()).toBe(true);
      expect(rejected.isPending()).toBe(false);
      expect(rejected.id).toBe(request.id);
    });

    it("fails when already ACCEPTED", async () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effect = request.reject();
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
        expect(result.left.from).toBe(LocationSharingRequestStatus.ACCEPTED);
        expect(result.left.to).toBe(LocationSharingRequestStatus.REJECTED);
      }
    });

    it("fails when already REJECTED", async () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effect = request.reject();
      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
        expect(result.left.from).toBe(LocationSharingRequestStatus.REJECTED);
      }
    });
  });

  describe("state query methods", () => {
    it("isPending returns true only for PENDING status", () => {
      const pending = LocationSharingRequest.reconstitute({
        id: "r1",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const accepted = LocationSharingRequest.reconstitute({
        id: "r2",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const rejected = LocationSharingRequest.reconstitute({
        id: "r3",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(pending.isPending()).toBe(true);
      expect(accepted.isPending()).toBe(false);
      expect(rejected.isPending()).toBe(false);
    });

    it("isAccepted returns true only for ACCEPTED status", () => {
      const pending = LocationSharingRequest.reconstitute({
        id: "r1",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const accepted = LocationSharingRequest.reconstitute({
        id: "r2",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(pending.isAccepted()).toBe(false);
      expect(accepted.isAccepted()).toBe(true);
    });

    it("isRejected returns true only for REJECTED status", () => {
      const pending = LocationSharingRequest.reconstitute({
        id: "r1",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const rejected = LocationSharingRequest.reconstitute({
        id: "r3",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(pending.isRejected()).toBe(false);
      expect(rejected.isRejected()).toBe(true);
    });

    it("isResolved returns true for ACCEPTED and REJECTED", () => {
      const pending = LocationSharingRequest.reconstitute({
        id: "r1",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const accepted = LocationSharingRequest.reconstitute({
        id: "r2",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const rejected = LocationSharingRequest.reconstitute({
        id: "r3",
        senderId: "s1",
        receiverId: "r2",
        status: LocationSharingRequestStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(pending.isResolved()).toBe(false);
      expect(accepted.isResolved()).toBe(true);
      expect(rejected.isResolved()).toBe(true);
    });
  });

  describe("getUniqueKey", () => {
    it("returns composite key of senderId and receiverId", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-abc",
        receiverId: "receiver-xyz",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.getUniqueKey()).toBe("sender-abc:receiver-xyz");
    });
  });

  describe("involvesUser", () => {
    it("returns true when user is the sender", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "user-sender",
        receiverId: "user-receiver",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.involvesUser("user-sender")).toBe(true);
    });

    it("returns true when user is the receiver", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "user-sender",
        receiverId: "user-receiver",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.involvesUser("user-receiver")).toBe(true);
    });

    it("returns false when user is not involved", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "user-sender",
        receiverId: "user-receiver",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.involvesUser("user-unrelated")).toBe(false);
    });
  });

  describe("isFromUser", () => {
    it("returns true when user is the sender", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.isFromUser("sender-123")).toBe(true);
      expect(request.isFromUser("receiver-456")).toBe(false);
    });
  });

  describe("isToUser", () => {
    it("returns true when user is the receiver", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.isToUser("receiver-456")).toBe(true);
      expect(request.isToUser("sender-123")).toBe(false);
    });
  });

  describe("getOtherParty", () => {
    it("returns receiverId when given senderId", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.getOtherParty("sender-123")).toBe("receiver-456");
    });

    it("returns senderId when given receiverId", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.getOtherParty("receiver-456")).toBe("sender-123");
    });

    it("returns null when user is not involved", () => {
      const request = LocationSharingRequest.reconstitute({
        id: "request-123",
        senderId: "sender-123",
        receiverId: "receiver-456",
        status: LocationSharingRequestStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(request.getOtherParty("unrelated-user")).toBeNull();
    });
  });

  describe("request lifecycle flow", () => {
    it("completes full accept flow from creation", async () => {
      const request = await Effect.runPromise(
        LocationSharingRequest.create({
          senderId: "sender-123",
          receiverId: "receiver-456",
        }),
      );

      expect(request.isPending()).toBe(true);
      expect(request.isResolved()).toBe(false);

      const accepted = await Effect.runPromise(request.accept());

      expect(accepted.isAccepted()).toBe(true);
      expect(accepted.isResolved()).toBe(true);
    });

    it("completes full reject flow from creation", async () => {
      const request = await Effect.runPromise(
        LocationSharingRequest.create({
          senderId: "sender-123",
          receiverId: "receiver-456",
        }),
      );

      expect(request.isPending()).toBe(true);

      const rejected = await Effect.runPromise(request.reject());

      expect(rejected.isRejected()).toBe(true);
      expect(rejected.isResolved()).toBe(true);
    });

    it("prevents double acceptance", async () => {
      const request = await Effect.runPromise(
        LocationSharingRequest.create({
          senderId: "sender-123",
          receiverId: "receiver-456",
        }),
      );

      const accepted = await Effect.runPromise(request.accept());
      const secondAccept = await Effect.runPromise(
        Effect.either(accepted.accept()),
      );

      expect(secondAccept._tag).toBe("Left");
      expect(accepted.isAccepted()).toBe(true);
    });

    it("prevents accepting after rejection", async () => {
      const request = await Effect.runPromise(
        LocationSharingRequest.create({
          senderId: "sender-123",
          receiverId: "receiver-456",
        }),
      );

      const rejected = await Effect.runPromise(request.reject());
      const tryAccept = await Effect.runPromise(
        Effect.either(rejected.accept()),
      );

      expect(tryAccept._tag).toBe("Left");
      expect(rejected.isRejected()).toBe(true);
    });
  });
});
