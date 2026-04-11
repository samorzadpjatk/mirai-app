import { describe, it, expect } from "bun:test";
import {
  createStateMachine,
  createSimpleStateMachine,
  type StateMachineConfig,
} from "./state-machine";

describe("[UNIT] state-machine", () => {
  // Test state machine configuration
  const testConfig: StateMachineConfig<"A" | "B" | "C"> = {
    transitions: {
      A: ["B", "C"],
      B: ["C"],
      C: [],
    },
    terminalStates: ["C"],
    initialState: "A",
  };

  describe("createStateMachine", () => {
    it("creates frozen state machine object", () => {
      const sm = createStateMachine(testConfig);

      expect(Object.isFrozen(sm)).toBe(true);
    });

    describe("canTransition", () => {
      it("allows valid transitions", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.canTransition("A", "B")).toBe(true);
        expect(sm.canTransition("A", "C")).toBe(true);
        expect(sm.canTransition("B", "C")).toBe(true);
      });

      it("rejects invalid transitions", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.canTransition("A", "A")).toBe(false);
        expect(sm.canTransition("B", "A")).toBe(false);
        expect(sm.canTransition("B", "B")).toBe(false);
      });

      it("handles terminal states (no outgoing transitions)", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.canTransition("C", "A")).toBe(false);
        expect(sm.canTransition("C", "B")).toBe(false);
        expect(sm.canTransition("C", "C")).toBe(false);
      });
    });

    describe("isTerminal", () => {
      it("returns true for terminal states", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.isTerminal("C")).toBe(true);
      });

      it("returns false for non-terminal states", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.isTerminal("A")).toBe(false);
        expect(sm.isTerminal("B")).toBe(false);
      });

      it("returns false when no terminal states configured", () => {
        const sm = createStateMachine({
          transitions: {
            A: ["B"],
            B: ["A"],
          },
        });

        expect(sm.isTerminal("A")).toBe(false);
        expect(sm.isTerminal("B")).toBe(false);
      });
    });

    describe("getValidTransitions", () => {
      it("returns all valid target states", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.getValidTransitions("A")).toEqual(["B", "C"]);
        expect(sm.getValidTransitions("B")).toEqual(["C"]);
      });

      it("returns empty array for terminal states", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.getValidTransitions("C")).toEqual([]);
      });

      it("returns empty array for unknown states", () => {
        const sm = createStateMachine(testConfig);

        // TypeScript would prevent this, but runtime safety is good
        expect(sm.getValidTransitions("D" as "A")).toEqual([]);
      });
    });

    describe("getInitialState", () => {
      it("returns configured initial state", () => {
        const sm = createStateMachine(testConfig);

        expect(sm.getInitialState("B")).toBe("A");
      });

      it("returns default when no initial state configured", () => {
        const sm = createStateMachine<"A" | "B">({
          transitions: {
            A: ["B"],
            B: [],
          },
        });

        expect(sm.getInitialState("A")).toBe("A");
        expect(sm.getInitialState("B")).toBe("B");
      });
    });
  });

  describe("createSimpleStateMachine", () => {
    it("creates state machine with transitions only", () => {
      const sm = createSimpleStateMachine<
        "IDLE" | "RUNNING" | "COMPLETED" | "FAILED"
      >({
        IDLE: ["RUNNING"],
        RUNNING: ["COMPLETED", "FAILED"],
        COMPLETED: [],
        FAILED: [],
      });

      expect(sm.canTransition("IDLE", "RUNNING")).toBe(true);
      expect(sm.canTransition("RUNNING", "COMPLETED")).toBe(true);
      expect(sm.canTransition("RUNNING", "FAILED")).toBe(true);
      expect(sm.canTransition("IDLE", "COMPLETED")).toBe(false);
    });

    it("has no terminal states by default", () => {
      const sm = createSimpleStateMachine<"A" | "B">({
        A: ["B"],
        B: ["A"],
      });

      expect(sm.isTerminal("A")).toBe(false);
      expect(sm.isTerminal("B")).toBe(false);
    });

    it("has no initial state by default", () => {
      const sm = createSimpleStateMachine<"A" | "B">({
        A: ["B"],
        B: [],
      });

      expect(sm.getInitialState("A")).toBe("A");
    });
  });

  describe("real-world state machines", () => {
    it("works for Challenge status", () => {
      type ChallengeStatus =
        | "DRAFT"
        | "PENDING"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELLED";

      const challengeSM = createStateMachine<ChallengeStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE", "CANCELLED"],
          ACTIVE: ["COMPLETED", "CANCELLED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        terminalStates: ["COMPLETED", "CANCELLED"],
        initialState: "DRAFT",
      });

      // Valid transitions
      expect(challengeSM.canTransition("DRAFT", "PENDING")).toBe(true);
      expect(challengeSM.canTransition("PENDING", "ACTIVE")).toBe(true);
      expect(challengeSM.canTransition("PENDING", "CANCELLED")).toBe(true);
      expect(challengeSM.canTransition("ACTIVE", "COMPLETED")).toBe(true);

      // Invalid transitions
      expect(challengeSM.canTransition("DRAFT", "ACTIVE")).toBe(false);
      expect(challengeSM.canTransition("COMPLETED", "DRAFT")).toBe(false);

      // Terminal states
      expect(challengeSM.isTerminal("COMPLETED")).toBe(true);
      expect(challengeSM.isTerminal("CANCELLED")).toBe(true);
      expect(challengeSM.isTerminal("ACTIVE")).toBe(false);

      // Initial state
      expect(challengeSM.getInitialState("PENDING")).toBe("DRAFT");
    });

    it("works for Notification status", () => {
      type NotificationStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";

      const notificationSM = createStateMachine<NotificationStatus>({
        transitions: {
          PENDING: ["SENT", "FAILED"],
          SENT: ["DELIVERED", "FAILED"],
          DELIVERED: [],
          FAILED: [],
        },
        terminalStates: ["DELIVERED", "FAILED"],
        initialState: "PENDING",
      });

      expect(notificationSM.canTransition("PENDING", "SENT")).toBe(true);
      expect(notificationSM.canTransition("SENT", "DELIVERED")).toBe(true);
      expect(notificationSM.canTransition("PENDING", "DELIVERED")).toBe(false);
      expect(notificationSM.isTerminal("DELIVERED")).toBe(true);
    });
  });
});
