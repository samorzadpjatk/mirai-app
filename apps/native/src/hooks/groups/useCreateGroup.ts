import { orpc } from "@mirai-app/orpc/client";
import { invalidateGroupQueries } from "@mirai-app/orpc/client/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateGroup(tripId?: string | null) {
  const queryClient = useQueryClient();
  const createGroupMutation = useMutation(
    orpc.group.create.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient);
      },
    }),
  );

  const createGroup = async (args: { name: string; image?: string }) => {
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
