import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useCreateGroup(tripId?: string | null) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.group.create.mutationOptions({
      onSuccess: async (_newGroup) => {
        // invalidate groups list
        await queryClient.invalidateQueries({
          queryKey: [["group", "getAll"]],
        });
      },
    }),
  );

  const createGroup = async (args: {
    name: string;
    image?: string;
  }) => {
    const { name, image } = args;
    return await createMutation.mutateAsync({
      tripId: tripId ?? "",
      name,
      image,
    });
  };

  return {
    createGroup,
    isCreating: createMutation.isPending,
  } as const;
}
