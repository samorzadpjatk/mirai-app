import { Suspense } from "react";
import UserCardListSkelethon from "~/components/skelethons/UserCardListSkelethon";
import UserSearchableListOptimized from "./UserSearchableListOptimized";

const UserCardList = () => {
    return (
        <Suspense fallback={<UserCardListSkelethon />}>
            <UserSearchableListOptimized />x
        </Suspense>
    );
};

export default UserCardList;
