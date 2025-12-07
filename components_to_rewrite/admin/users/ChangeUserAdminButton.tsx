"use client"

import { TrashIcon, StarIcon } from "@radix-ui/react-icons";
import { Button, Skeleton } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

const ChangeUserAdminButton = ({ selectedUserId }: { selectedUserId: string }) => {
    const router = useRouter();
    const { data: user, isLoading: isLoadingUser } = api.user.getById.useQuery({ id: selectedUserId });
    const updateAdminStatusMutation = api.user.updateUserAdminStatus.useMutation({
        onSuccess: async () => {
            router.refresh();
        },
    });
    if (!user) return null;
    return (
        <Skeleton loading={isLoadingUser}>
            <Button
                size={{ "initial": "1", "xs": "2", "sm": "3" }}
                variant="soft"
                color={user.isAdmin ? "red" : "blue"}
                onClick={() => updateAdminStatusMutation.mutate({
                    userId: selectedUserId,
                    isAdmin: !user.isAdmin
                })}
                disabled={updateAdminStatusMutation.isPending}
            >
                {user.isAdmin ? <><TrashIcon />Remove admin</> : <><StarIcon />Assign admin</>}
            </Button>
        </Skeleton>
    );
}

export default ChangeUserAdminButton;