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