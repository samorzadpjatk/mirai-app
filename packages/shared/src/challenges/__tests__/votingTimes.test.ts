import { describe, it, expect } from "vitest";
import { resolveVotingTimes } from "../votingTimes";

describe("resolveVotingTimes", () => {
  it("returns nulls for non-peer-voting", () => {
    const result = resolveVotingTimes({
      scoringCategory: "SPEED",
      status: "VISIBLE",
    });
    expect(result.votingStartTime).toBeNull();
    expect(result.votingEndTime).toBeNull();
  });

  it("uses input voting times when in VOTING_PHASE", () => {
    const start = new Date("2024-06-15T18:00:00Z");
    const end = new Date("2024-06-16T18:00:00Z");
    const result = resolveVotingTimes({
      scoringCategory: "PEER_VOTING",
      status: "VOTING_PHASE",
      votingStartTime: start,
      votingEndTime: end,
    });
    expect(result.votingStartTime).toBe(start);
    expect(result.votingEndTime).toBe(end);
  });

  it("uses input voting times when COMPLETED", () => {
    const start = new Date("2024-06-15T18:00:00Z");
    const end = new Date("2024-06-16T18:00:00Z");
    const result = resolveVotingTimes({
      scoringCategory: "PEER_VOTING",
      status: "COMPLETED",
      votingStartTime: start,
      votingEndTime: end,
    });
    expect(result.votingStartTime).toBe(start);
    expect(result.votingEndTime).toBe(end);
  });

  it("uses template window when not in voting phase or completed", () => {
    const templateStart = new Date("2024-06-15T20:00:00Z");
    const templateEnd = new Date("2024-06-16T20:00:00Z");
    const result = resolveVotingTimes({
      scoringCategory: "PEER_VOTING",
      status: "VISIBLE",
      peerVotingTemplateWindow: {
        votingStartTime: templateStart,
        votingEndTime: templateEnd,
      },
    });
    expect(result.votingStartTime).toBe(templateStart);
    expect(result.votingEndTime).toBe(templateEnd);
  });

  it("prefers input times over template window even when template exists", () => {
    const inputStart = new Date("2024-06-15T18:00:00Z");
    const inputEnd = new Date("2024-06-16T18:00:00Z");
    const templateStart = new Date("2024-06-15T20:00:00Z");
    const templateEnd = new Date("2024-06-16T20:00:00Z");
    const result = resolveVotingTimes({
      scoringCategory: "PEER_VOTING",
      status: "VOTING_PHASE",
      votingStartTime: inputStart,
      votingEndTime: inputEnd,
      peerVotingTemplateWindow: {
        votingStartTime: templateStart,
        votingEndTime: templateEnd,
      },
    });
    expect(result.votingStartTime).toBe(inputStart);
    expect(result.votingEndTime).toBe(inputEnd);
  });

  it("returns undefined when template window is missing and not in voting phase", () => {
    const result = resolveVotingTimes({
      scoringCategory: "PEER_VOTING",
      status: "VISIBLE",
    });
    expect(result.votingStartTime).toBeUndefined();
    expect(result.votingEndTime).toBeUndefined();
  });

  it("returns undefined when input times missing in VOTING_PHASE", () => {
    const result = resolveVotingTimes({
      scoringCategory: "PEER_VOTING",
      status: "VOTING_PHASE",
    });
    expect(result.votingStartTime).toBeUndefined();
    expect(result.votingEndTime).toBeUndefined();
  });
});
