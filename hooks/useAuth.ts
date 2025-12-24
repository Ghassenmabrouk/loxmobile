import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { User } from 'firebase/auth';
import { Platform } from 'react-native';
import { authService } from '@/app/services/authService';
import { FirebaseUser } from '@/app/types/firebase';

async function setSecureItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function deleteSecureItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);

        const userDoc = await authService.getUserData(firebaseUser.uid);
        setUserData(userDoc);

        if (userDoc) {
          await setSecureItem('userRole', userDoc.role);
        }
      } else {
        setUser(null);
        setUserData(null);
        setIsAuthenticated(false);
        await deleteSecureItem('userRole');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signInWithEmail(email, password);
      console.log('[AUTH] Login successful:', user.email);

      const userDoc = await authService.getUserData(user.uid);
      const role = userDoc?.role || 'user';

      if (role === 'driver') {
        router.replace('/(tabs)/driver-home');
      } else if (role === 'admin') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)/on-time-home');
      }
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      console.error('[AUTH] Login error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(
    name: string,
    email: string,
    password: string,
    phoneNumber?: string,
    gender?: string
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const user = await authService.signUpWithEmail(
        email,
        password,
        firstName,
        lastName,
        phoneNumber || '',
        gender
      );

      console.log('[AUTH] Registration successful:', user.email);

      const userDoc = await authService.getUserData(user.uid);
      const role = userDoc?.role || 'user';

      if (role === 'driver') {
        router.replace('/(tabs)/driver-home');
      } else if (role === 'admin') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)/on-time-home');
      }
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      console.error('[AUTH] Registration error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle(idToken: string) {
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signInWithGoogle(idToken);
      console.log('[AUTH] Google login successful:', user.email);

      const userDoc = await authService.getUserData(user.uid);
      const role = userDoc?.role || 'user';

      if (role === 'driver') {
        router.replace('/(tabs)/driver-home');
      } else if (role === 'admin') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)/on-time-home');
      }
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      console.error('[AUTH] Google login error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      await authService.signOut();
      console.log('[AUTH] Logout successful');
      router.replace('/login');
    } catch (error: any) {
      const errorMessage = getFirebaseErrorMessage(error);
      console.error('[AUTH] Logout error:', errorMessage);
      setError(errorMessage);
    }
  }

  function getFirebaseErrorMessage(error: any): string {
    if (!error?.code) return error?.message || 'An error occurred';

    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      default:
        return error.message || 'An error occurred';
    }
  }

  return {
    isAuthenticated,
    user,
    userData,
    isLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}
