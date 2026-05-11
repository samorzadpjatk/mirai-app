import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";

export interface AdminChallengeUI {
  id: string;
  title: string;
  description: string;
  points: number;
  category: "standard" | "wintegral" | "special";
  icon: string;
  status: string;
  submissionType: "IMAGE" | "MULTI_IMAGE" | "VIDEO" | "TEXT" | "IMAGE_LOCATION" | "LOCATION" | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  tripId?: string;
  targetLatitude?: number | null;
  targetLongitude?: number | null;
}

export function useAdminChallenges() {
  const queryClient = useQueryClient();

  const { data: challengesData, isLoading } = useQuery(
    orpc.challenge.getAll.queryOptions({ input: {} }),
  );

  const createMutation = useMutation(
    orpc.challenge.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["challenge", "getAll"]],
        });
      },
    }),
  );

  const updateMutation = useMutation(
    orpc.challenge.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["challenge", "getAll"]],
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    orpc.challenge.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["challenge", "getAll"]],
        });
      },
    }),
  );

  interface DBChallenge {
    id: string;
    tripId: string;
    name?: string | null;
    title?: string | null;
    description?: string | null;
    points?: number | null;
    category?: string | null;
    icon?: string | null;
    status?: string | null;
  }

  const challenges: AdminChallengeUI[] = useMemo(() => {
    if (!Array.isArray(challengesData)) return [];

    const apiChallenges = challengesData as DBChallenge[];

    return apiChallenges.map((c) => ({
      id: String(c.id),
      title: c.name ?? c.title ?? "",
      description: c.description ?? "",
      points: Number(c.points ?? 0),
      category: (c.category ?? "standard") as AdminChallengeUI["category"],
      icon: c.icon ?? "star",
      status: c.status ?? "active",
      submissionType: "IMAGE",
      scoringCategory: "JUDGED_STAFF",
      tripId: c.tripId,
    }));
  }, [challengesData]);

  const createChallenge = async (
    payload: { tripId: string } & Partial<AdminChallengeUI>,
  ) => {
    const submissionType = payload.submissionType === 'MULTI_IMAGE'
      ? 'IMAGE'
      : (payload.submissionType ?? 'IMAGE');

    return createMutation.mutateAsync({
      tripId: payload.tripId,
      name: payload.title ?? '',
      description: payload.description ?? '',
      submissionType,
      scoringCategory: payload.scoringCategory ?? 'JUDGED_STAFF',
      targetLatitude: payload.targetLatitude ?? undefined,
      targetLongitude: payload.targetLongitude ?? undefined,
    } as const);
  };

  const updateChallenge = async (
    id: string,
    payload: { tripId: string } & Partial<AdminChallengeUI>,
  ) => {
    return updateMutation.mutateAsync({
      id,
      tripId: payload.tripId,
      name: payload.title ?? '',
      description: payload.description ?? '',
    });
  };

  const deleteChallenge = async (id: string, tripId: string) => {
    return deleteMutation.mutateAsync({ id, tripId } as const);
  };

  const stats = useMemo(
    () => ({
      activeChallenges: challenges.filter((c) => c.status === "active").length,
      wintegralChallenges: challenges.filter((c) => c.category === "wintegral")
        .length,
    }),
    [challenges],
  );

  return {
    challenges,
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    stats,
  } as const;
}
