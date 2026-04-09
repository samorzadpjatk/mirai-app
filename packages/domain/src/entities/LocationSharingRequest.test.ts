import { describe, it, expect } from "bun:test";
import {
  LocationSharingRequest,
  LocationSharingRequestStatus,
} from "./LocationSharingRequest";

describe("[UNIT] LocationSharingRequest Entity", () => {
  describe("LocationSharingRequest.create", () => {
    it("should create with valid data", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.senderId).toBe("user-123");
        expect(result.value.receiverId).toBe("user-456");
        expect(result.value.status).toBe(LocationSharingRequestStatus.PENDING);
        expect(result.value.isPending()).toBe(true);
      }
    });

    it("should create with accepted status", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
        status: LocationSharingRequestStatus.ACCEPTED,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe(LocationSharingRequestStatus.ACCEPTED);
        expect(result.value.isAccepted()).toBe(true);
      }
    });

    it("should reject empty senderId", () => {
      const result = LocationSharingRequest.create({
        senderId: "",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty receiverId", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject same sender and receiver", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("different");
      }
    });
  });

  describe("LocationSharingRequest.accept", () => {
    it("should accept request", () => {
      const requestResult = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(requestResult.kind).toBe("ok");
      if (requestResult.kind !== "ok") return;

      const accepted = requestResult.value.accept();

      expect(accepted.status).toBe(LocationSharingRequestStatus.ACCEPTED);
      expect(accepted.isAccepted()).toBe(true);
      expect(accepted.isPending()).toBe(false);
      expect(accepted.isResolved()).toBe(true);
    });
  });

  describe("LocationSharingRequest.reject", () => {
    it("should reject request", () => {
      const requestResult = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(requestResult.kind).toBe("ok");
      if (requestResult.kind !== "ok") return;

      const rejected = requestResult.value.reject();

      expect(rejected.status).toBe(LocationSharingRequestStatus.REJECTED);
      expect(rejected.isRejected()).toBe(true);
      expect(rejected.isPending()).toBe(false);
      expect(rejected.isResolved()).toBe(true);
    });
  });

  describe("LocationSharingRequest.involvesUser", () => {
    it("should check if involves sender", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.involvesUser("user-123")).toBe(true);
      }
    });

    it("should check if involves receiver", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.involvesUser("user-456")).toBe(true);
      }
    });

    it("should return false for unrelated user", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.involvesUser("user-789")).toBe(false);
      }
    });
  });

  describe("LocationSharingRequest.isFromUser / isToUser", () => {
    it("should identify sender", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isFromUser("user-123")).toBe(true);
        expect(result.value.isFromUser("user-456")).toBe(false);
      }
    });

    it("should identify receiver", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isToUser("user-456")).toBe(true);
        expect(result.value.isToUser("user-123")).toBe(false);
      }
    });
  });

  describe("LocationSharingRequest.getOtherParty", () => {
    it("should return receiver when given sender", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getOtherParty("user-123")).toBe("user-456");
      }
    });

    it("should return sender when given receiver", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getOtherParty("user-456")).toBe("user-123");
      }
    });

    it("should return null for unrelated user", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getOtherParty("user-789")).toBeNull();
      }
    });
  });

  describe("LocationSharingRequest.getUniqueKey", () => {
    it("should return composite key", () => {
      const result = LocationSharingRequest.create({
        senderId: "user-123",
        receiverId: "user-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getUniqueKey()).toBe("user-123:user-456");
      }
    });
  });
});
