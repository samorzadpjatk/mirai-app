import { describe, it, expect } from "bun:test";
import {
  createStateMachine,
  createSimpleStateMachine,
  type StateMachineConfig,
} from "./state-machine";

describe("[UNIT] state-machine", () => {
  // Define test state type
  type TestStatus = "DRAFT" | "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

  describe("createStateMachine with full config", () => {
    it("creates state machine with all configuration options", () => {
      const config: StateMachineConfig<TestStatus> = {
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE", "CANCELLED"],
          ACTIVE: ["COMPLETED", "CANCELLED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        terminalStates: ["COMPLETED", "CANCELLED"],
        initialState: "DRAFT",
      };

      const sm = createStateMachine(config);

      expect(sm).toBeDefined();
      expect(typeof sm.canTransition).toBe("function");
      expect(typeof sm.isTerminal).toBe("function");
      expect(typeof sm.getValidTransitions).toBe("function");
      expect(typeof sm.getInitialState).toBe("function");
    });

    it("returns frozen object that cannot be modified", () => {
      const config: StateMachineConfig<TestStatus> = {
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      };

      const sm = createStateMachine(config);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => ((sm as any).canTransition = () => true)).toThrow();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => ((sm as any).isTerminal = () => true)).toThrow();
    });
  });

  describe("canTransition", () => {
    const sm = createStateMachine<TestStatus>({
      transitions: {
        DRAFT: ["PENDING"],
        PENDING: ["ACTIVE", "CANCELLED"],
        ACTIVE: ["COMPLETED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
      },
    });

    it("returns true for valid transitions", () => {
      expect(sm.canTransition("DRAFT", "PENDING")).toBe(true);
      expect(sm.canTransition("PENDING", "ACTIVE")).toBe(true);
      expect(sm.canTransition("PENDING", "CANCELLED")).toBe(true);
      expect(sm.canTransition("ACTIVE", "COMPLETED")).toBe(true);
      expect(sm.canTransition("ACTIVE", "CANCELLED")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(sm.canTransition("DRAFT", "ACTIVE")).toBe(false);
      expect(sm.canTransition("DRAFT", "COMPLETED")).toBe(false);
      expect(sm.canTransition("PENDING", "DRAFT")).toBe(false);
      expect(sm.canTransition("PENDING", "COMPLETED")).toBe(false);
      expect(sm.canTransition("ACTIVE", "DRAFT")).toBe(false);
      expect(sm.canTransition("ACTIVE", "PENDING")).toBe(false);
      expect(sm.canTransition("COMPLETED", "DRAFT")).toBe(false);
      expect(sm.canTransition("CANCELLED", "ACTIVE")).toBe(false);
    });

    it("returns false for transitions from terminal states", () => {
      const terminalSm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: [],
          COMPLETED: [],
          CANCELLED: [],
        },
        terminalStates: ["ACTIVE", "COMPLETED", "CANCELLED"],
      });

      expect(terminalSm.canTransition("ACTIVE", "COMPLETED")).toBe(false);
      expect(terminalSm.canTransition("COMPLETED", "DRAFT")).toBe(false);
      expect(terminalSm.canTransition("CANCELLED", "DRAFT")).toBe(false);
    });

    it("returns false when transition targets are empty", () => {
      const emptyTargetsSm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: [],
          PENDING: [],
          ACTIVE: [],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      expect(emptyTargetsSm.canTransition("DRAFT", "PENDING")).toBe(false);
      expect(emptyTargetsSm.canTransition("DRAFT", "ACTIVE")).toBe(false);
    });

    it("returns false for self-transitions when not explicitly allowed", () => {
      expect(sm.canTransition("DRAFT", "DRAFT")).toBe(false);
      expect(sm.canTransition("ACTIVE", "ACTIVE")).toBe(false);
      expect(sm.canTransition("COMPLETED", "COMPLETED")).toBe(false);
    });

    it("returns true for self-transitions when explicitly allowed", () => {
      const selfTransitionSm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["DRAFT", "PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["ACTIVE", "COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      expect(selfTransitionSm.canTransition("DRAFT", "DRAFT")).toBe(true);
      expect(selfTransitionSm.canTransition("ACTIVE", "ACTIVE")).toBe(true);
    });
  });

  describe("isTerminal", () => {
    it("returns true for configured terminal states", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED", "CANCELLED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        terminalStates: ["COMPLETED", "CANCELLED"],
      });

      expect(sm.isTerminal("COMPLETED")).toBe(true);
      expect(sm.isTerminal("CANCELLED")).toBe(true);
    });

    it("returns false for non-terminal states", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED", "CANCELLED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        terminalStates: ["COMPLETED", "CANCELLED"],
      });

      expect(sm.isTerminal("DRAFT")).toBe(false);
      expect(sm.isTerminal("PENDING")).toBe(false);
      expect(sm.isTerminal("ACTIVE")).toBe(false);
    });

    it("returns false for all states when no terminal states configured", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      expect(sm.isTerminal("DRAFT")).toBe(false);
      expect(sm.isTerminal("PENDING")).toBe(false);
      expect(sm.isTerminal("ACTIVE")).toBe(false);
      expect(sm.isTerminal("COMPLETED")).toBe(false);
      expect(sm.isTerminal("CANCELLED")).toBe(false);
    });

    it("handles single terminal state", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        terminalStates: ["COMPLETED"],
      });

      expect(sm.isTerminal("COMPLETED")).toBe(true);
      expect(sm.isTerminal("CANCELLED")).toBe(false);
    });
  });

  describe("getValidTransitions", () => {
    it("returns all valid transition targets from a state", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE", "CANCELLED"],
          ACTIVE: ["COMPLETED", "CANCELLED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      expect(sm.getValidTransitions("DRAFT")).toEqual(["PENDING"]);
      expect(sm.getValidTransitions("PENDING")).toEqual([
        "ACTIVE",
        "CANCELLED",
      ]);
      expect(sm.getValidTransitions("ACTIVE")).toEqual([
        "COMPLETED",
        "CANCELLED",
      ]);
    });

    it("returns empty array for states with no outgoing transitions", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      expect(sm.getValidTransitions("COMPLETED")).toEqual([]);
      expect(sm.getValidTransitions("CANCELLED")).toEqual([]);
    });

    it("returns empty array for unknown states", () => {
      const limitedStatus = ["DRAFT", "PENDING", "COMPLETED"] as const;
      type LimitedStatus = (typeof limitedStatus)[number];

      const sm = createStateMachine<LimitedStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["COMPLETED"],
          COMPLETED: [],
        },
      });

      // Using type assertion to test runtime behavior with undefined key
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(sm.getValidTransitions("UNKNOWN" as any)).toEqual([]);
    });

    it("returns typed readonly array", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      const transitions = sm.getValidTransitions("PENDING");

      // Verify correct transitions are returned
      expect(transitions).toEqual(["ACTIVE"]);

      // Type checking: TypeScript should enforce readonly
      // The return type is readonly TStatus[]
      const _typeCheck: readonly TestStatus[] = transitions;
      expect(_typeCheck).toBe(transitions);
    });

    it("returns correct transitions for states with multiple targets", () => {
      type MultiStatus = "START" | "A" | "B" | "C" | "D" | "END";

      const sm = createStateMachine<MultiStatus>({
        transitions: {
          START: ["A", "B", "C", "D"],
          A: ["END"],
          B: ["END"],
          C: ["END"],
          D: ["END"],
          END: [],
        },
      });

      expect(sm.getValidTransitions("START")).toEqual(["A", "B", "C", "D"]);
    });
  });

  describe("getInitialState", () => {
    it("returns configured initial state when provided", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        initialState: "DRAFT",
      });

      expect(sm.getInitialState("PENDING")).toBe("DRAFT");
      expect(sm.getInitialState("ACTIVE")).toBe("DRAFT");
    });

    it("returns default state when initialState is not configured", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      expect(sm.getInitialState("PENDING")).toBe("PENDING");
      expect(sm.getInitialState("DRAFT")).toBe("DRAFT");
    });

    it("prioritizes configured initialState over default", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        initialState: "DRAFT",
      });

      // Even if we pass a different default, configured initialState wins
      expect(sm.getInitialState("CANCELLED")).toBe("DRAFT");
    });
  });

  describe("createSimpleStateMachine", () => {
    it("creates state machine with minimal config (transitions only)", () => {
      type SimpleStatus = "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";

      const sm = createSimpleStateMachine<SimpleStatus>({
        IDLE: ["RUNNING"],
        RUNNING: ["COMPLETED", "FAILED"],
        COMPLETED: [],
        FAILED: [],
      });

      expect(sm).toBeDefined();
      expect(typeof sm.canTransition).toBe("function");
      expect(typeof sm.isTerminal).toBe("function");
      expect(typeof sm.getValidTransitions).toBe("function");
      expect(typeof sm.getInitialState).toBe("function");
    });

    it("behaves correctly with simple state machine", () => {
      type SimpleStatus = "IDLE" | "RUNNING" | "COMPLETED" | "FAILED";

      const sm = createSimpleStateMachine<SimpleStatus>({
        IDLE: ["RUNNING"],
        RUNNING: ["COMPLETED", "FAILED"],
        COMPLETED: [],
        FAILED: [],
      });

      // Test transitions
      expect(sm.canTransition("IDLE", "RUNNING")).toBe(true);
      expect(sm.canTransition("IDLE", "COMPLETED")).toBe(false);
      expect(sm.canTransition("RUNNING", "COMPLETED")).toBe(true);
      expect(sm.canTransition("RUNNING", "FAILED")).toBe(true);
      expect(sm.canTransition("COMPLETED", "IDLE")).toBe(false);

      // Test terminal detection (no terminalStates configured)
      expect(sm.isTerminal("COMPLETED")).toBe(false);
      expect(sm.isTerminal("FAILED")).toBe(false);

      // Test valid transitions
      expect(sm.getValidTransitions("IDLE")).toEqual(["RUNNING"]);
      expect(sm.getValidTransitions("RUNNING")).toEqual([
        "COMPLETED",
        "FAILED",
      ]);
      expect(sm.getValidTransitions("COMPLETED")).toEqual([]);

      // Test initial state fallback
      expect(sm.getInitialState("IDLE")).toBe("IDLE");
    });
  });

  describe("edge cases", () => {
    it("handles undefined transitions gracefully", () => {
      type SingleStatus = "ONLY";

      const sm = createStateMachine<SingleStatus>({
        transitions: {
          ONLY: [],
        },
      });

      expect(sm.canTransition("ONLY", "ONLY")).toBe(false);
      expect(sm.getValidTransitions("ONLY")).toEqual([]);
      expect(sm.isTerminal("ONLY")).toBe(false);
    });

    it("handles single state machine", () => {
      type SingleStatus = "SINGLE";

      const sm = createStateMachine<SingleStatus>({
        transitions: {
          SINGLE: [],
        },
        terminalStates: ["SINGLE"],
        initialState: "SINGLE",
      });

      expect(sm.canTransition("SINGLE", "SINGLE")).toBe(false);
      expect(sm.isTerminal("SINGLE")).toBe(true);
      expect(sm.getValidTransitions("SINGLE")).toEqual([]);
      expect(sm.getInitialState("OTHER" as SingleStatus)).toBe("SINGLE");
    });

    it("handles all states being terminal", () => {
      type EndStatus = "END1" | "END2" | "END3";

      const sm = createStateMachine<EndStatus>({
        transitions: {
          END1: [],
          END2: [],
          END3: [],
        },
        terminalStates: ["END1", "END2", "END3"],
      });

      expect(sm.isTerminal("END1")).toBe(true);
      expect(sm.isTerminal("END2")).toBe(true);
      expect(sm.isTerminal("END3")).toBe(true);
    });

    it("handles empty terminal states array", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
        terminalStates: [],
      });

      expect(sm.isTerminal("COMPLETED")).toBe(false);
      expect(sm.isTerminal("DRAFT")).toBe(false);
    });

    it("handles complex workflow with multiple paths", () => {
      type WorkflowStatus =
        | "START"
        | "REVIEW"
        | "APPROVED"
        | "REJECTED"
        | "PROCESSING"
        | "DONE"
        | "ARCHIVED";

      const workflowSm = createStateMachine<WorkflowStatus>({
        transitions: {
          START: ["REVIEW"],
          REVIEW: ["APPROVED", "REJECTED"],
          APPROVED: ["PROCESSING"],
          REJECTED: ["ARCHIVED"],
          PROCESSING: ["DONE"],
          DONE: ["ARCHIVED"],
          ARCHIVED: [],
        },
        terminalStates: ["ARCHIVED"],
        initialState: "START",
      });

      // Verify main path
      expect(workflowSm.canTransition("START", "REVIEW")).toBe(true);
      expect(workflowSm.canTransition("REVIEW", "APPROVED")).toBe(true);
      expect(workflowSm.canTransition("APPROVED", "PROCESSING")).toBe(true);
      expect(workflowSm.canTransition("PROCESSING", "DONE")).toBe(true);
      expect(workflowSm.canTransition("DONE", "ARCHIVED")).toBe(true);

      // Verify rejection path
      expect(workflowSm.canTransition("REVIEW", "REJECTED")).toBe(true);
      expect(workflowSm.canTransition("REJECTED", "ARCHIVED")).toBe(true);

      // Verify invalid cross-paths
      expect(workflowSm.canTransition("START", "APPROVED")).toBe(false);
      expect(workflowSm.canTransition("REJECTED", "PROCESSING")).toBe(false);
      expect(workflowSm.canTransition("DONE", "REJECTED")).toBe(false);

      // Verify terminal
      expect(workflowSm.isTerminal("ARCHIVED")).toBe(true);
      expect(workflowSm.isTerminal("DONE")).toBe(false);

      // Verify initial state
      expect(workflowSm.getInitialState("REVIEW")).toBe("START");
    });

    it("maintains type safety through transitions", () => {
      const sm = createStateMachine<TestStatus>({
        transitions: {
          DRAFT: ["PENDING"],
          PENDING: ["ACTIVE"],
          ACTIVE: ["COMPLETED"],
          COMPLETED: [],
          CANCELLED: [],
        },
      });

      // These should compile without errors
      const fromDraft: readonly TestStatus[] = sm.getValidTransitions("DRAFT");
      const canGo: boolean = sm.canTransition("DRAFT", "PENDING");
      const isTerm: boolean = sm.isTerminal("COMPLETED");
      const initial: TestStatus = sm.getInitialState("DRAFT");

      expect(fromDraft).toEqual(["PENDING"]);
      expect(canGo).toBe(true);
      expect(isTerm).toBe(false);
      expect(initial).toBe("DRAFT");
    });
  });
});
