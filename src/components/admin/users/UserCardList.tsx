import { api } from "~/trpc/server";
import { Suspense } from "react";
import UserCardListSkelethon from "~/components/skelethons/UserCardListSkelethon";
import UserSearchableList from "./UserSearchableList";

const UserCardList = async () => {
    const users = await api.user.getAll();

    return (
        <Suspense fallback={<UserCardListSkelethon />}>
            <UserSearchableList users={users} />
        </Suspense>
    );
};

export default UserCardList;
