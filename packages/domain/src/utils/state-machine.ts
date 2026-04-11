/**
 * State Machine Mixin
 *
 * Factory for creating state machines with typed status transitions.
 * Eliminates duplicate status machine implementations across entities.
 *
 * @module state-machine
 */

/**
 * Configuration for a state machine
 */
export interface StateMachineConfig<TStatus extends string> {
  /** Valid transitions from each state (from -> valid to[]) */
  readonly transitions: Readonly<Record<TStatus, readonly TStatus[]>>;
  /** Terminal states where no further transitions are allowed */
  readonly terminalStates?: readonly TStatus[];
  /** Initial state for new entities */
  readonly initialState?: TStatus;
}

/**
 * State machine interface with transition helpers
 */
export interface StateMachine<TStatus extends string> {
  /** Check if a transition from one state to another is valid */
  canTransition: (from: TStatus, to: TStatus) => boolean;
  /** Check if a state is terminal (no outgoing transitions) */
  isTerminal: (status: TStatus) => boolean;
  /** Get all valid transition targets from a state */
  getValidTransitions: (from: TStatus) => readonly TStatus[];
  /** Get the initial state, falling back to default if not configured */
  getInitialState: (defaultState: TStatus) => TStatus;
}

/**
 * Create a state machine from configuration.
 *
 * @param config - State machine configuration
 * @returns Frozen state machine object with helper methods
 *
 * @example
 * ```typescript
 * // Define at module level (once per entity type)
 * const challengeSM = createStateMachine<ChallengeStatus>({
 *   transitions: {
 *     DRAFT: ["PENDING"],
 *     PENDING: ["ACTIVE", "CANCELLED"],
 *     ACTIVE: ["COMPLETED", "CANCELLED"],
 *     COMPLETED: [],
 *     CANCELLED: [],
 *   },
 *   terminalStates: ["COMPLETED", "CANCELLED"],
 *   initialState: "DRAFT",
 * });
 *
 * // In entity methods:
 * if (!challengeSM.canTransition(this.status, "ACTIVE")) {
 *   return err(new StateTransitionError(this.status, "ACTIVE"));
 * }
 * ```
 */
export function createStateMachine<TStatus extends string>(
  config: StateMachineConfig<TStatus>,
): StateMachine<TStatus> {
  const { transitions, terminalStates = [], initialState } = config;

  const terminalSet = new Set<TStatus>(terminalStates as TStatus[]);

  function canTransition(from: TStatus, to: TStatus): boolean {
    const validTargets = transitions[from];
    if (!validTargets) {
      return false;
    }
    return validTargets.includes(to);
  }

  function isTerminal(status: TStatus): boolean {
    return terminalSet.has(status);
  }

  function getValidTransitions(from: TStatus): readonly TStatus[] {
    return transitions[from] ?? [];
  }

  function getInitialState(defaultState: TStatus): TStatus {
    return initialState ?? defaultState;
  }

  return Object.freeze({
    canTransition,
    isTerminal,
    getValidTransitions,
    getInitialState,
  });
}

/**
 * Create a simple state machine with only transition checking.
 * Useful when you only need to validate transitions without terminal/initial states.
 *
 * @param transitions - Valid transitions mapping
 * @returns State machine with minimal configuration
 *
 * @example
 * ```typescript
 * const simpleSM = createSimpleStateMachine({
 *   IDLE: ["RUNNING"],
 *   RUNNING: ["COMPLETED", "FAILED"],
 *   COMPLETED: [],
 *   FAILED: [],
 * });
 * ```
 */
export function createSimpleStateMachine<TStatus extends string>(
  transitions: Readonly<Record<TStatus, readonly TStatus[]>>,
): StateMachine<TStatus> {
  return createStateMachine({ transitions });
}
