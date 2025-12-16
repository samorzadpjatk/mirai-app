export interface User {
    id: string;
    authUserId: string | null;
    email: string | null;
    name: string | null;
    image: string | null;
    wristNumber: string | null;
    houseNumber: string | null;
    isAdmin: boolean;
    isModerator: boolean;
    isServiceAccount: boolean;
    groupId: string | null;
    emailVerified: Date | null;
}
export type Role = "admin" | "moderator" | "service-account";
//# sourceMappingURL=user.d.ts.map