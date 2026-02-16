import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import api from '../api/axios';

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/auth/me/');
                setUser(response.data);
            } catch (error) {
                console.log("Not authenticated");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            // Optional: Call logout endpoint to clear cookies
            // await api.post('/auth/logout/'); 
            // We need to implement logout view for this to work perfectly, 
            // but for now clearing state is enough if we assume the cookie expires or we delete it.
            // Best practice is to have a logout endpoint.
            // I'll assume we might add it later or just clear state.
            // Actually, to clear httpOnly cookie, we MUST call an endpoint.
            // I will implement a logout endpoint next.
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
