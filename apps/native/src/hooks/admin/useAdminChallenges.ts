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
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  tripId?: string;
  targetLatitude?: number | null;
  targetLongitude?: number | null;
}

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

export function transformRawChallenge(rawChallenge: DBChallenge): AdminChallengeUI {
  return {
    id: String(rawChallenge.id),
    title: rawChallenge.name ?? rawChallenge.title ?? "",
    description: rawChallenge.description ?? "",
    points: Number(rawChallenge.points ?? 0),
    category: (rawChallenge.category ?? "standard") as AdminChallengeUI["category"],
    icon: rawChallenge.icon ?? "star",
    status: rawChallenge.status ?? "active",
    submissionType: "IMAGE",
    scoringCategory: "JUDGED_STAFF",
    tripId: rawChallenge.tripId,
  };
}

export function buildCreateChallengeInput(
  payload: { tripId: string } & Partial<AdminChallengeUI>,
) {
  const submissionType =
    payload.submissionType === "MULTI_IMAGE" ? "IMAGE" : (payload.submissionType ?? "IMAGE");

  return {
    tripId: payload.tripId,
    name: payload.title ?? "",
    description: payload.description ?? "",
    submissionType,
    scoringCategory: payload.scoringCategory ?? "JUDGED_STAFF",
    targetLatitude: payload.targetLatitude ?? undefined,
    targetLongitude: payload.targetLongitude ?? undefined,
  } as const;
}

export function buildChallengeStats(challenges: AdminChallengeUI[]) {
  return {
    activeChallenges: challenges.filter((c) => c.status === "active").length,
    wintegralChallenges: challenges.filter((c) => c.category === "wintegral").length,
  };
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

  const challenges: AdminChallengeUI[] = useMemo(() => {
    if (!Array.isArray(challengesData)) return [];
    return (challengesData as DBChallenge[]).map(transformRawChallenge);
  }, [challengesData]);

  const createChallenge = async (payload: { tripId: string } & Partial<AdminChallengeUI>) => {
    return createMutation.mutateAsync(buildCreateChallengeInput(payload));
  };

  const updateChallenge = async (
    id: string,
    payload: { tripId: string } & Partial<AdminChallengeUI>,
  ) => {
    return updateMutation.mutateAsync({
      id,
      tripId: payload.tripId,
      name: payload.title ?? "",
      description: payload.description ?? "",
    });
  };

  const deleteChallenge = async (id: string, tripId: string) => {
    return deleteMutation.mutateAsync({ id, tripId } as const);
  };

  const stats = useMemo(() => buildChallengeStats(challenges), [challenges]);

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
