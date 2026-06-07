import { orpc } from "@mirai-app/orpc/client";
import { invalidateGroupQueries } from "@mirai-app/orpc/client/query";
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineMutation } from "~/hooks/offline/useOfflineMutation";

export function useCreateGroup(tripId?: string | null) {
  const queryClient = useQueryClient();
  const createGroupMutation = useOfflineMutation({
    mutationFn: (variables: { name: string; image?: string }) =>
      orpc.group.create.mutate({
        tripId: tripId ?? "",
        name: variables.name,
        image: variables.image,
      }),
    mutationKey: "group.create",
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient);
    },
  });

  const createGroup = async (args: { name: string; image?: string }) => {
    return await createGroupMutation.mutateAsync(args);
  };

  return {
    createGroup,
    isCreating: createGroupMutation.isPending,
  } as const;
}
