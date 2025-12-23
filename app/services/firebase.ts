import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBQUUUhpvyAB_5q9Rz20l02Mhc3uPT-x5Y",
  authDomain: "loxurya-cfb98.firebaseapp.com",
  projectId: "loxurya-cfb98",
  storageBucket: "loxurya-cfb98.firebasestorage.app",
  messagingSenderId: "28417044389",
  appId: "1:28417044389:web:c42bb25cc335d7ec49824c",
  measurementId: "G-656H3JD7GM"
};

let app;
let auth;
let db;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  auth = Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });

  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { app, auth, db };
