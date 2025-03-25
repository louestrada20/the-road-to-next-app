export type AuthUser = {
    id: string;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    passwordHash?: string | null;
};