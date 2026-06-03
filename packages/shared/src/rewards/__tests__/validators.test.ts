import { describe, expect, it } from "vitest";
import { canTransitionPurchaseStatus } from "../validators";

describe("canTransitionPurchaseStatus", () => {
  it("returns true when transitioning to the same status", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "BOUGHT")).toBe(true);
    expect(canTransitionPurchaseStatus("ACCEPTED", "ACCEPTED")).toBe(true);
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "IN_DELIVERY")).toBe(true);
    expect(canTransitionPurchaseStatus("CANCELLED", "CANCELLED")).toBe(true);
    expect(canTransitionPurchaseStatus("DELIVERED", "DELIVERED")).toBe(true);
  });

  it("allows BOUGHT → ACCEPTED", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "ACCEPTED")).toBe(true);
  });

  it("allows BOUGHT → CANCELLED", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "CANCELLED")).toBe(true);
  });

  it("allows ACCEPTED → IN_DELIVERY", () => {
    expect(canTransitionPurchaseStatus("ACCEPTED", "IN_DELIVERY")).toBe(true);
  });

  it("allows ACCEPTED → CANCELLED", () => {
    expect(canTransitionPurchaseStatus("ACCEPTED", "CANCELLED")).toBe(true);
  });

  it("allows IN_DELIVERY → DELIVERED", () => {
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "DELIVERED")).toBe(true);
  });

  it("allows IN_DELIVERY → CANCELLED", () => {
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "CANCELLED")).toBe(true);
  });

  it("forbids BOUGHT → IN_DELIVERY", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "IN_DELIVERY")).toBe(false);
  });

  it("forbids BOUGHT → DELIVERED", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "DELIVERED")).toBe(false);
  });

  it("forbids ACCEPTED → BOUGHT", () => {
    expect(canTransitionPurchaseStatus("ACCEPTED", "BOUGHT")).toBe(false);
  });

  it("forbids ACCEPTED → DELIVERED", () => {
    expect(canTransitionPurchaseStatus("ACCEPTED", "DELIVERED")).toBe(false);
  });

  it("forbids IN_DELIVERY → BOUGHT", () => {
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "BOUGHT")).toBe(false);
  });

  it("forbids IN_DELIVERY → ACCEPTED", () => {
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "ACCEPTED")).toBe(false);
  });

  it("forbids any transition from CANCELLED", () => {
    expect(canTransitionPurchaseStatus("CANCELLED", "BOUGHT")).toBe(false);
    expect(canTransitionPurchaseStatus("CANCELLED", "ACCEPTED")).toBe(false);
    expect(canTransitionPurchaseStatus("CANCELLED", "IN_DELIVERY")).toBe(false);
    expect(canTransitionPurchaseStatus("CANCELLED", "DELIVERED")).toBe(false);
  });

  it("forbids any transition from DELIVERED", () => {
    expect(canTransitionPurchaseStatus("DELIVERED", "BOUGHT")).toBe(false);
    expect(canTransitionPurchaseStatus("DELIVERED", "ACCEPTED")).toBe(false);
    expect(canTransitionPurchaseStatus("DELIVERED", "IN_DELIVERY")).toBe(false);
    expect(canTransitionPurchaseStatus("DELIVERED", "CANCELLED")).toBe(false);
  });
});
