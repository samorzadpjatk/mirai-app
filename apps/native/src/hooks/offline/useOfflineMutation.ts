import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { classifyError } from "~/services/offline/errorClassifier";
import { addToQueue } from "~/services/offline/storage";
import { useOfflineQueueStore } from "~/stores/offlineQueueStore";
import { useNetworkStatus } from "./useNetworkStatus";

interface UseOfflineMutationOptions<TData, TError, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  mutationKey: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  invalidateQueries?: string[];
  isUnsafe?: boolean;
}

export function useOfflineMutation<TData, TError, TVariables>({
  mutationFn,
  mutationKey,
  onSuccess,
  onError,
  onSettled,
  invalidateQueries,
  isUnsafe = false,
}: UseOfflineMutationOptions<TData, TError, TVariables>) {
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();
  const { incrementPending } = useOfflineQueueStore();

  const baseMutation = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (invalidateQueries) {
        for (const queryKey of invalidateQueries) {
          void queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      }
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      onError?.(error as TError, variables);
    },
    onSettled: (data, error, variables) => {
      onSettled?.(data, error as TError | null, variables);
    },
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      // Block unsafe mutations when offline
      if (!isConnected && isUnsafe) {
        throw new Error("This action requires an internet connection.");
      }

      try {
        const result = await baseMutation.mutateAsync(variables);
        return result;
      } catch (error) {
        const classified = classifyError(error);

        // Queue network errors for retry
        if (classified.shouldQueue && !isUnsafe) {
          const queuedMutation = await addToQueue({
            id: `${mutationKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            mutationKey,
            variables,
            timestamp: Date.now(),
            retryCount: 0,
            status: "pending",
          });

          incrementPending();

          // Return a promise that resolves when the mutation is eventually processed
          return new Promise<TData>((resolve, reject) => {
            // The queue processor will handle this later
            // For now, we return a pending promise
            // In a real implementation, you'd want to track this and resolve/reject
            // when the queue processor finishes
            setTimeout(() => {
              reject(new Error("Mutation queued for offline sync"));
            }, 0);
          });
        }

        throw error;
      }
    },
    [baseMutation, isConnected, isUnsafe, mutationKey, incrementPending],
  );

  return {
    ...baseMutation,
    mutate,
    mutateAsync: mutate,
  };
}
