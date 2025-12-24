import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FirebaseUser } from '../types/firebase';
import { generateAnonymousCode } from './anonymousCodeService';

export const authService = {
  async signUpWithEmail(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    gender?: string
  ): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    const anonymousCode = await generateAnonymousCode('client');

    const userData: FirebaseUser = {
      userId: user.uid,
      email,
      role: 'client',
      anonymousCode,
      status: 'active',
      firstName,
      lastName,
      username: firstName.toLowerCase(),
      phoneNumber,
      gender: (gender as any) || 'male',
      vipAccess: 'none',
      vipLevel: 'none',
      securityClearance: 'standard',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return user;
  },

  async signInWithEmail(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async signInWithGoogle(idToken: string): Promise<User> {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const anonymousCode = await generateAnonymousCode('client');
      const nameParts = (user.displayName || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userData: FirebaseUser = {
        userId: user.uid,
        email: user.email!,
        role: 'client',
        anonymousCode,
        status: 'active',
        firstName,
        lastName,
        username: firstName.toLowerCase(),
        phoneNumber: user.phoneNumber || '',
        name: user.displayName || '',
        photo: user.photoURL || '',
        vipAccess: 'none',
        vipLevel: 'none',
        securityClearance: 'standard',
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(userDocRef, userData);
    }

    return user;
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  async getUserData(userId: string): Promise<FirebaseUser | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as FirebaseUser;
    }
    return null;
  },

  async migrateUserDocument(userId: string): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return;
    }

    const userData = userDoc.data();
    const updates: any = {};

    if (!userData.userId) {
      updates.userId = userId;
    }

    if (!userData.anonymousCode) {
      updates.anonymousCode = await generateAnonymousCode('client');
    }

    if (!userData.status) {
      updates.status = 'active';
    }

    if (userData.role === 'user') {
      updates.role = 'client';
    }

    if (!userData.role) {
      updates.role = 'client';
    }

    if (!userData.securityClearance) {
      updates.securityClearance = 'standard';
    }

    if (!userData.phoneNumber) {
      updates.phoneNumber = '';
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await setDoc(userDocRef, updates, { merge: true });
    }
  }
};
