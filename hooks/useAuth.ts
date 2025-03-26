import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { User } from '@/app/types/user';
import { API_URL } from '@/app/services/config';

type AuthError = {
  message: string;
  status?: number;
};

function isAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      console.log('[AUTH] Checking authentication status...');
      const token = await SecureStore.getItemAsync('authToken');
      const userDataString = await SecureStore.getItemAsync('userData');
      
      console.log('[AUTH] Token exists:', !!token);
      console.log('[AUTH] User data exists:', !!userDataString);

      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('[AUTH] Retrieved user data from storage:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } else if (token && !userDataString) {
        // If we have token but no user data, fetch fresh user data
        await fetchUserData(token);
      }
    } catch (error) {
      console.error('[AUTH] Error during checkAuth:', error);
    } finally {
      console.log('[AUTH] Auth check completed');
      setIsLoading(false);
    }
  }

  async function fetchUserData(token: string) {
    try {
      console.log('[AUTH] Fetching fresh user data...');
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[AUTH] Fetched user data:', userData);
        const mappedUser = mapBackendUserToFrontend(userData);
        await SecureStore.setItemAsync('userData', JSON.stringify(mappedUser));
        setUser(mappedUser);
        setIsAuthenticated(true);
      } else {
        console.log('[AUTH] Failed to fetch user data, logging out...');
        await signOut();
      }
    } catch (error) {
      console.error('[AUTH] Error fetching user data:', error);
      await signOut();
    }
  }

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_URL}/login/login`;
      console.log('[AUTH] Making login request to:', url);
      console.log('[AUTH] Request payload:', { email, password: '*****' });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[AUTH] Login response status:', response.status);
      
      const data = await response.json();
      console.log('[AUTH] Login response data:', data);

      if (!response.ok) {
        const errorMessage = data.message || 'Login failed';
        console.error('[AUTH] Login failed:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('[AUTH] Storing auth token...');
      await SecureStore.setItemAsync('authToken', data.token);
      
      console.log('[AUTH] Mapping user data...');
      const authenticatedUser = mapBackendUserToFrontend(data.userInfo);
      
      console.log('[AUTH] Storing user data...');
      await SecureStore.setItemAsync('userData', JSON.stringify(authenticatedUser));
      
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      
      console.log('[AUTH] Login successful, navigating to tabs...');
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = isAuthError(error) ? error.message : 'Login failed';
      console.error('[AUTH] Error during signIn:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      console.log('[AUTH] SignIn process completed');
      setIsLoading(false);
    }
  }

  async function signUp(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    gender?: string;
  }) {
    setIsLoading(true);
    setError(null);
    console.log('[AUTH] Starting signUp process...');

    try {
      const registrationData = {
        username: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: userData.password,
        gender: userData.gender || 'not specified',
      };

      const url = `${API_URL}/register`;
      console.log('[AUTH] Making registration request to:', url);
      console.log('[AUTH] Registration payload:', {
        ...registrationData,
        password: '*****'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      console.log('[AUTH] Registration response status:', response.status);
      const data = await response.json();
      console.log('[AUTH] Registration response data:', data);

      if (!response.ok) {
        const errorMessage = data.message || 'Registration failed';
        console.error('[AUTH] Registration failed:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('[AUTH] Registration successful, auto-logging in...');
      await signIn(userData.email, userData.password);
    } catch (error) {
      const errorMessage = isAuthError(error) ? error.message : 'Registration failed';
      console.error('[AUTH] Error during signUp:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      console.log('[AUTH] SignUp process completed');
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      console.log('[AUTH] Starting signOut process...');
      
      const url = `${API_URL}/logout`;
      console.log('[AUTH] Making logout request to:', url);
      
      await fetch(url, { method: 'POST' });
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      
      console.log('[AUTH] SignOut successful, clearing state...');
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/login');
    } catch (error) {
      const errorMessage = isAuthError(error) ? error.message : 'Failed to sign out';
      console.error('[AUTH] Error during signOut:', errorMessage);
      setError(errorMessage);
    }
  }

  function mapBackendUserToFrontend(backendUser: any): User {
    console.log('[AUTH] Mapping backend user to frontend type:', backendUser);
    if (!backendUser) {
      throw new Error('No user data received from backend');
    }
    
    return {
      _id: backendUser.id,
      username: backendUser.name,
      email: backendUser.email,
      phoneNumber: backendUser.phoneNumber,
      role: backendUser.role,
      gender: backendUser.gender,
      photo: backendUser.photo,
      vipAccess: backendUser.vip,
      vipExpiresAt: backendUser.vipExpiresAt ? new Date(backendUser.vipExpiresAt) : null,
    };
  }

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
  };
}