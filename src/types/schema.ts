import type { CoinTransaction, Group, User } from "@prisma/client";

export type CoinTransactionWithAdmin = CoinTransaction & {
    admin: User;
};

export type CoinTransactionWithAllFields = CoinTransaction & {
    admin: User;
    group: Group;
};

export type GroupWithAllFields = Group & {
    members: User[];
    organizer: User;
    coinTransactions: CoinTransactionWithAdmin[];
}

export type GroupAction = GroupWithAllFields & {
    action: "edit" | "delete";
}

export type UserWithAllFields = User & {
    group: Group | null;
    organizerGroup: Group | null;
};