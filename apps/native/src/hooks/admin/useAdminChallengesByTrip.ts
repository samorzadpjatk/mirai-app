import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

export interface ChallengeItem {
  id: string;
  title: string;
  description: string | null;
  basePoints: number;
  status: string;
  tripId: string;
}

export function useAdminChallengesByTrip(tripId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const challengeQueryOptions = trpc.challenge.getAllByTrip.queryOptions({ tripId });
  const { data: challengesData, isLoading } = useQuery({
    ...challengeQueryOptions,
    enabled: !!tripId,
  });

  const challenges: ChallengeItem[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((challenge) => ({
      id: challenge.id,
      title: challenge.name,
      description: challenge.description ?? null,
      basePoints: challenge.basePoints ?? 0,
      status: challenge.status ?? 'HIDDEN',
      tripId: challenge.tripId,
    }));
  }, [challengesData]);

  const deleteChallengeMutation = useMutation(
    trpc.challenge.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: challengeQueryOptions.queryKey });
      },
    }),
  );

  const deleteChallenge = (id: string) => {
    return deleteChallengeMutation.mutateAsync({ id, tripId });
  };

  const stats = useMemo(() => ({
    totalChallenges: challenges.length,
  }), [challenges]);

  return {
    challenges,
    isLoading,
    isDeleting: deleteChallengeMutation.isPending,
    deleteChallenge,
    stats,
  };
}
