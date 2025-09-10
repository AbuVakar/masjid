import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const verifyUser = useCallback(async () => {
    // Check if user is already authenticated via server session
    try {
      console.log('UserContext - Verifying user...');
      const token = apiService.getToken();
      console.log('UserContext - Current token:', token ? 'EXISTS' : 'MISSING');

      // Only try to verify if we have a token
      if (!token) {
        console.log('UserContext - No token found, skipping verification');
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const response = await apiService.getProfile();
      if (response.success && response.data) {
        console.log('UserContext - User verified successfully');
        setUser(response.data);
        setIsAuthenticated(true);
        setIsAdmin(response.data.role === 'admin');
        if (response.data.token) {
          apiService.setToken(response.data.token);
        }
      } else {
        throw new Error('Profile fetch failed');
      }
    } catch (error) {
      console.log('UserContext - User verification failed:', error.message);
      // Only clear token if it's a 401 error (expired/invalid token)
      if (error.message.includes('401')) {
        apiService.setToken(null);
      }
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Add a small delay to ensure server is ready
    const timer = setTimeout(() => {
      verifyUser();
    }, 1000);

    return () => clearTimeout(timer);
  }, [verifyUser]);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        apiService.setToken(token);
        setUser(userData);
        setIsAuthenticated(true);
        setIsAdmin(userData.role === 'admin');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial state
      apiService.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      throw error; // Re-throw for parent component to handle
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      if (response.success && response.data) {
        const { token, user: newUser } = response.data;
        apiService.setToken(token);
        setUser(newUser);
        setIsAuthenticated(true);
        setIsAdmin(newUser.role === 'admin');
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Clear any partial state
      apiService.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      throw error; // Re-throw for parent component to handle
    }
  };

  const logout = () => {
    apiService.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsGuest(false);
  };

  const enableGuestMode = () => {
    setIsGuest(true);
  };

  const updateUser = (updatedUserData) => {
    console.log('UserContext - updateUser called with:', updatedUserData);
    console.log('UserContext - New preferences:', updatedUserData?.preferences);
    setUser(updatedUserData);
    setIsAdmin(updatedUserData.role === 'admin');
    console.log('UserContext - User state updated');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isGuest,
    login,
    logout,
    register,
    enableGuestMode,
    updateUser,
    refreshUser: verifyUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
