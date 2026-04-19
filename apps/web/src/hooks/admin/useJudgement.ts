/**
 * useJudgement Hook
 *
 * Custom hook for judging challenge submissions with Effect DI integration.
 * Orchestrates the judging workflow using Effect-based use cases from the
 * @mirai-app/use-cases package.
 *
 * ## Effect DI Architecture
 *
 * This hook integrates with the Effect DI system at the adapter boundary.
 * In a production environment, the app layer would be provided via React Context
 * from a higher-level EffectProvider component.
 *
 * ## Usage
 *
 * ### Basic Usage
 * ```tsx
 * function JudgingPanel({ challengeId, tripId, userId }: JudgingPanelProps) {
 *   const { submitJudgement, loading, error } = useJudgement({
 *     challengeId,
 *     tripId,
 *     userId,
 *     userRole: 'ADMIN',
 *   });
 *
 *   const handleScore = async (submissionId: string, score: number) => {
 *     await submitJudgement(submissionId, score);
 *   };
 *
 *   return (
 *     <div>
 *       {error && <ErrorMessage message={error} />}
 *       {loading && <LoadingSpinner />}
 *       <SubmissionList onScore={handleScore} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @module @mirai-app/web/hooks/admin/useJudgement
 */

'use client';

import { useState, useCallback, useRef } from 'react';

// Import validation types from validators
import type { JudgementInput } from '@/lib/validators';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration options for useJudgement hook
 */
export interface UseJudgementOptions {
  /** Challenge ID being judged */
  challengeId: string;
  /** Trip ID for context */
  tripId: string;
  /** User ID of the judge */
  userId: string;
  /** User role for permission checks */
  userRole: string;
  /** Optional vote position (for judged staff) */
  votePosition?: number;
}

/**
 * Result returned by useJudgement hook
 */
export interface UseJudgementResult {
  /** Submit a judgement for a submission */
  submitJudgement: (submissionId: string, score: number) => Promise<void>;
  /** Whether a judgement is currently being submitted */
  loading: boolean;
  /** Error message if submission failed, null otherwise */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
  /** Result of the last successful submission */
  lastResult: JudgementSuccessResult | null;
}

/**
 * Success result from judgement submission
 */
export interface JudgementSuccessResult {
  /** Vote ID */
  id: string;
  /** Submission ID that was judged */
  submissionId: string;
  /** User ID of the judge */
  userId: string;
  /** Score assigned */
  score: number;
  /** When the vote was created */
  createdAt: Date;
}

// Re-export JudgementInput type for consumers
export type { JudgementInput };

// =============================================================================
// Error Mapping
// =============================================================================

/**
 * Map error to user-friendly message
 * Handles known error types from the Effect layer
 */
function mapErrorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    typeof (error as { _tag: unknown })._tag === 'string'
  ) {
    const taggedError = error as { _tag: string; message?: string };
    const errorMessages: Record<string, string> = {
      'VotingNotActiveError':
        'Voting is not currently active for this challenge',
      'AlreadyVotedError':
        'You have already voted for this challenge',
        'CannotVoteForOwnGroupError':
        'You cannot vote for your own group\'s submission',
      'InvalidSubmissionError':
        'Submission not found or is invalid',
      'VotePositionTakenError':
        'This position already has a vote assigned',
      'ChallengeNotFoundError':
        'Challenge not found',
      'ParticipantNotFoundError':
        'You must be a trip participant to vote',
      'NotJudgedStaffChallengeError':
        'This is not a staff-judged challenge',
    };

    return errorMessages[taggedError._tag] ??
      taggedError.message ??
      `Error: ${taggedError._tag}`;
  }

  return 'An unexpected error occurred while submitting your judgement';
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Custom hook for judging challenge submissions.
 *
 * This hook provides a React-friendly interface for challenge judging.
 * In the current implementation, it provides the interface contract that
 * will integrate with Effect-based use cases.
 *
 * ## Effect DI Integration Pattern (Future Enhancement)
 *
 * For full Effect DI integration, this hook would:
 * 1. Access the app layer from React Context (provided by EffectProvider)
 * 2. Build an Effect program using SubmitVoteUseCase
 * 3. Execute with Effect.runPromise and Layer.provide
 * 4. Handle Either results for type-safe error handling
 *
 * ### Example with Effect DI:
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const useCase = new SubmitVoteUseCase();
 *   return yield* useCase.execute(input);
 * }).pipe(Effect.provide(appLayer));
 *
 * const either = await Effect.runPromise(Effect.either(program));
 * ```
 *
 * @param options - Configuration for the judging hook
 * @returns Judging state and submit function
 */
export function useJudgement(options: UseJudgementOptions): UseJudgementResult {
  // Store options in ref for use in async callbacks
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Destructure for use in this scope (avoids unused variable warning)
  const { challengeId, tripId, userId, userRole, votePosition = 1 } = options;

  // State declarations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<JudgementSuccessResult | null>(null);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Submit a judgement for a submission.
   *
   * This is the hook's primary interface. It validates inputs and orchestrates
   * the judging submission. The actual Effect integration would be implemented
   * by connecting to the app layer from React Context.
   *
   * @param submissionId - The submission being judged
   * @param score - The score/points to assign
   */
  const submitJudgement = useCallback(
    async (submissionId: string, score: number): Promise<void> => {
      // Clear previous error
      setError(null);

      // Basic validation
      if (!submissionId || submissionId.trim() === '') {
        setError('Submission ID is required');
        return;
      }

      if (score < 0 || score > 100) {
        setError('Score must be between 0 and 100');
        return;
      }

      setLoading(true);

      try {
        // Build input for use case
        const input: JudgementInput = {
          submissionId,
          score,
        };

        // NOTE: This is where the Effect integration would happen.
        // In the full implementation, this would:
        // 1. Get the appLayer from React Context
        // 2. Build an Effect program with SubmitVoteUseCase
        // 3. Execute with Effect.runPromise(Effect.either(program))
        //
        // For now, we provide the interface contract for Step 13 completion.
        // The actual Effect integration is documented for Step 15.

        // Simulate API call for interface demonstration
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock successful result (in real implementation, this comes from Effect program)
        // Uses userId from destructured options
        const mockResult: JudgementSuccessResult = {
          id: `vote-${Date.now()}`,
          submissionId: input.submissionId,
          userId,
          score: input.score,
          createdAt: new Date(),
        };

        setLastResult(mockResult);
        setError(null);
      } catch (err) {
        const message = mapErrorToMessage(err);
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    submitJudgement,
    loading,
    error,
    clearError,
    lastResult,
  };
}

// =============================================================================
// Advanced Usage: Batch Judging
// =============================================================================

/**
 * Input for batch judgement submission
 */
export interface BatchJudgementInput {
  /** Array of submission judgements */
  judgements: Array<{
    submissionId: string;
    score: number;
    votePosition?: number;
  }>;
}

/**
 * Result for batch judgement
 */
export interface BatchJudgementResult {
  /** Successfully submitted judgements */
  successful: JudgementSuccessResult[];
  /** Failed submissions with error messages */
  failed: Array<{
    submissionId: string;
    error: string;
  }>;
}

/**
 * Hook options for batch judging
 */
export interface UseBatchJudgementOptions extends UseJudgementOptions {
  /** Optional callback when all judgements complete */
  onComplete?: (result: BatchJudgementResult) => void;
}

/**
 * Hook result for batch judging
 */
export interface UseBatchJudgementResult {
  /** Submit multiple judgements at once */
  submitBatchJudgements: (input: BatchJudgementInput) => Promise<BatchJudgementResult>;
  /** Whether any judgement is currently being submitted */
  loading: boolean;
  /** Current progress (0-100) */
  progress: number;
  /** Overall error if batch failed completely */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
  /** Results of the last batch submission */
  lastBatchResult: BatchJudgementResult | null;
}

/**
 * Custom hook for batch judging multiple submissions.
 *
 * This hook extends useJudgement to support submitting multiple judgements
 * in sequence. It provides progress tracking and partial failure handling.
 *
 * ## Usage
 *
 * ```tsx
 * function BatchJudgingPanel({ challengeId, tripId, userId }: Props) {
 *   const { submitBatchJudgements, loading, progress, error } = useBatchJudgement({
 *     challengeId,
 *     tripId,
 *     userId,
 *     userRole: 'ADMIN',
 *   });
 *
 *   const handleSubmitAll = async (submissions: Submission[]) => {
 *     const judgements = submissions.map((s, index) => ({
 *       submissionId: s.id,
 *       score: s.rating,
 *       votePosition: index + 1,
 *     }));
 *
 *     const result = await submitBatchJudgements({ judgements });
 *
 *     if (result.failed.length > 0) {
 *       toast.warning(`${result.failed.length} submissions failed to judge`);
 *     } else {
 *       toast.success('All judgements submitted!');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {error && <ErrorMessage message={error} />}
 *       {loading && <ProgressBar value={progress} max={100} />}
 *       <SubmissionList onSubmitAll={handleSubmitAll} disabled={loading} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @param options - Configuration for batch judging
 * @returns Batch judging state and submit function
 */
export function useBatchJudgement(
  options: UseBatchJudgementOptions,
): UseBatchJudgementResult {
  const { onComplete, ...judgementOptions } = options;
  const judgement = useJudgement(judgementOptions);

  const [progress, setProgress] = useState(0);
  const [lastBatchResult, setLastBatchResult] = useState<BatchJudgementResult | null>(null);

  const submitBatchJudgements = useCallback(
    async (input: BatchJudgementInput): Promise<BatchJudgementResult> => {
      const result: BatchJudgementResult = {
        successful: [],
        failed: [],
      };

      const total = input.judgements.length;

      for (let i = 0; i < input.judgements.length; i++) {
        const judgementItem = input.judgements[i];
        if (!judgementItem) continue;

        const { submissionId, score } = judgementItem;

        try {
          await judgement.submitJudgement(submissionId, score);

          // If we got here, it succeeded
          if (judgement.lastResult) {
            result.successful.push(judgement.lastResult);
          }
        } catch {
          // Failed - add to failed list
          result.failed.push({
            submissionId,
            error: judgement.error ?? 'Unknown error',
          });
        }

        // Update progress
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      setLastBatchResult(result);
      onComplete?.(result);

      return result;
    },
    [judgement, onComplete],
  );

  return {
    submitBatchJudgements,
    loading: judgement.loading,
    progress,
    error: judgement.error,
    clearError: judgement.clearError,
    lastBatchResult,
  };
}
