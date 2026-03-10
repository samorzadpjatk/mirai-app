import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/trpc/client";
import { invalidateGroupQueries } from "@mirai-app/trpc/client/query";

export function useCreateGroup(tripId?: string | null) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createGroupMutation = useMutation(trpc.group.create.mutationOptions({
    onSuccess: async () => { await invalidateGroupQueries(queryClient); },
  }));

  const createGroup = async (args: {
    name: string;
    image?: string;
  }) => {
    const { name, image } = args;
    return await createGroupMutation.mutateAsync({
      tripId: tripId ?? "",
      name,
      image,
    });
  };

  return {
    createGroup,
    isCreating: createGroupMutation.isPending,
  } as const;
}
