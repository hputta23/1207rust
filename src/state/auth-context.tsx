import React, { createContext, useContext, useState } from 'react';
import { auditService } from '../services/audit-service';

export type UserRole = 'TRADER' | 'VIEWER' | 'ADMIN';

export interface User {
    id: string;
    username: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);

    const login = async (username: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // Mock validation
            if (!username) {
                throw new Error('Please enter a username.');
            }

            // Mock Login Success
            const newUser: User = {
                id: `user-${Math.floor(Math.random() * 10000)}`,
                username: username,
                role: 'TRADER'
            };
            setUser(newUser);
            auditService.log('LOGIN', { success: true, username }, newUser.id);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            auditService.log('LOGIN_FAILED', { error: err.message }, 'guest');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        if (user) {
            auditService.log('LOGOUT', { duration: 'session_end' }, user.id);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, logout, clearError }}>
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
