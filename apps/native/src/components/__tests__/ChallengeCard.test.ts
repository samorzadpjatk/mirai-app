import { describe, it, expect } from "@jest/globals";
import {
  getChallengeIcon,
  getChallengeBackgroundColor,
  getChallengeIconColor,
  getChallengeStatusColor,
  getChallengeStatusLabel,
} from "../admin/challenges/ChallengeCard";

describe("getChallengeIcon", () => {
  it("should map known icons", () => {
    expect(getChallengeIcon("eco")).toBe("leaf");
    expect(getChallengeIcon("terminal")).toBe("terminal");
    expect(getChallengeIcon("flight_takeoff")).toBe("airplane");
    expect(getChallengeIcon("fitness_center")).toBe("barbell");
    expect(getChallengeIcon("star")).toBe("star");
  });

  it("should default to star for unknown icons", () => {
    expect(getChallengeIcon("unknown")).toBe("star");
    expect(getChallengeIcon("")).toBe("star");
  });
});

describe("getChallengeBackgroundColor", () => {
  it("should return wintegral color", () => {
    expect(getChallengeBackgroundColor("wintegral")).toBe("#00ced1");
  });

  it("should return default color for non-wintegral", () => {
    expect(getChallengeBackgroundColor("campus")).toBe("rgba(0, 206, 209, 0.1)");
  });
});

describe("getChallengeIconColor", () => {
  it("should return wintegral color", () => {
    expect(getChallengeIconColor("wintegral")).toBe("#0f2323");
  });

  it("should return default color for non-wintegral", () => {
    expect(getChallengeIconColor("campus")).toBe("#00ced1");
  });
});

describe("getChallengeStatusColor", () => {
  it("should return draft color", () => {
    expect(getChallengeStatusColor("draft")).toBe("#ef4444");
  });

  it("should return default color for non-draft", () => {
    expect(getChallengeStatusColor("active")).toBe("#9ca3af");
  });
});

describe("getChallengeStatusLabel", () => {
  it("should return DRAFT for draft status", () => {
    expect(getChallengeStatusLabel("draft", "wintegral")).toBe("DRAFT");
    expect(getChallengeStatusLabel("draft", "campus")).toBe("DRAFT");
  });

  it("should return Trip for wintegral category", () => {
    expect(getChallengeStatusLabel("active", "wintegral")).toBe("Trip");
  });

  it("should return Campus for non-wintegral", () => {
    expect(getChallengeStatusLabel("active", "campus")).toBe("Campus");
  });
});
