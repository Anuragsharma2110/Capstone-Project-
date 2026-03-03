export type UserRole = 'LEARNER' | 'PROFESSOR' | 'ADMIN';

export const UserRole = {
    LEARNER: 'LEARNER' as UserRole,
    PROFESSOR: 'PROFESSOR' as UserRole,
    ADMIN: 'ADMIN' as UserRole,
};

export interface User {
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
    team_id?: number;
    exp?: number; // JWT expiration
}

export interface AuthResponse {
    access: string;
    refresh: string;
}
