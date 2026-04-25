import React, { createContext, useState, useEffect } from 'react';
import axiosInstance, { setupInterceptors } from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const logoutUser = () => {
        setAuthTokens(null);
        setUserProfile(null);
        localStorage.removeItem('authTokens');
    };

    // Initialize interceptors with current state handlers
    useEffect(() => {
        setupInterceptors(authTokens, setAuthTokens, logoutUser);
    }, [authTokens]);

    const fetchUserProfile = async () => {
        try {
            const response = await axiosInstance.get('/api/users/me/');
            setUserProfile(response.data);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            logoutUser();
        }
    };

    const loginUser = async (username, password) => {
        try {
            const response = await axiosInstance.post('/api/token/', { username, password });
            const data = response.data;
            setAuthTokens(data);
            localStorage.setItem('authTokens', JSON.stringify(data));
            
            // Re-setup interceptors immediately so the profile fetch uses the new token
            setupInterceptors(data, setAuthTokens, logoutUser);
            
            await fetchUserProfile();
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Invalid credentials' };
        }
    };

    const refreshUserData = async () => {
        if (authTokens) {
            await fetchUserProfile();
        }
    }

    useEffect(() => {
        if (authTokens) {
            fetchUserProfile().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const contextData = {
        userProfile,
        authTokens,
        loginUser,
        logoutUser,
        refreshUserData
    };

    return (
        <AuthContext.Provider value={contextData}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
