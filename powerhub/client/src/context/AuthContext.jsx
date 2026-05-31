import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const storedUser = authService.getCurrentUser();
            setUser(storedUser);
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = async (userData) => {
        const loggedInUser = await authService.login(userData);
        setUser(loggedInUser);
    };

    const register = async (userData) => {
        const registeredUser = await authService.register(userData);
        setUser(registeredUser);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
