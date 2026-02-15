import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useCreateGroup(tripId?: string | null) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.group.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: [["group", "getAll"]],
        });
      },
    }),
  );

  const assignMutation = useMutation(
    trpc.group.assignUserToGroup.mutationOptions(),
  );

  const createGroup = async (args: {
    name: string;
    code: string;
    image?: string;
    selectedMembers?: string[];
  }) => {
    const { name, code, image, selectedMembers = [] } = args;
    const result = await createMutation.mutateAsync({
      tripId: tripId ?? "",
      name,
      code,
      image,
    });

    // assign members if any
    if (result && selectedMembers.length > 0) {
      for (const userId of selectedMembers) {
        await assignMutation.mutateAsync({
          userId,
          tripId: tripId ?? "",
          groupId: result.id,
        });
      }
    }

    return result;
  };

  return {
    createGroup,
    isCreating: createMutation.isPending || assignMutation.isPending,
  } as const;
}
