import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  avatar_url: string;
  date_of_birth?: string;
  vip_status: boolean;
  total_rides: number;
  rating: number;
  created_at: any;
  updated_at: any;
}

export interface UserSettings {
  id: string;
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  ride_updates: boolean;
  promotional_offers: boolean;
  language: string;
  currency: string;
  created_at: any;
  updated_at: any;
}

export interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_favorite: boolean;
  created_at: any;
  updated_at: any;
}

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'user_profiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  static async createProfile(userId: string, email: string, fullName: string): Promise<UserProfile | null> {
    try {
      const profileData = {
        email,
        full_name: fullName,
        phone_number: '',
        avatar_url: '',
        vip_status: false,
        total_rides: 0,
        rating: 5.0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'user_profiles', userId), profileData);
      await this.createDefaultSettings(userId);

      return { id: userId, ...profileData, created_at: new Date(), updated_at: new Date() };
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'user_profiles', userId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  static async getSettings(userId: string): Promise<UserSettings | null> {
    try {
      const docRef = doc(db, 'user_settings', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserSettings;
      }
      return null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  static async createDefaultSettings(userId: string): Promise<UserSettings | null> {
    try {
      const settingsData = {
        user_id: userId,
        push_notifications: true,
        email_notifications: true,
        sms_notifications: false,
        ride_updates: true,
        promotional_offers: false,
        language: 'en',
        currency: 'USD',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'user_settings', userId), settingsData);

      return { id: userId, ...settingsData, created_at: new Date(), updated_at: new Date() };
    } catch (error) {
      console.error('Error creating settings:', error);
      return null;
    }
  }

  static async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings | null> {
    try {
      const docRef = doc(db, 'user_settings', userId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as UserSettings;
      }
      return null;
    } catch (error) {
      console.error('Error updating settings:', error);
      return null;
    }
  }

  static async getSavedLocations(userId: string): Promise<SavedLocation[]> {
    try {
      const q = query(
        collection(db, 'saved_locations'),
        where('user_id', '==', userId),
        orderBy('is_favorite', 'desc'),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const locations: SavedLocation[] = [];

      querySnapshot.forEach((doc) => {
        locations.push({ id: doc.id, ...doc.data() } as SavedLocation);
      });

      return locations;
    } catch (error) {
      console.error('Error fetching saved locations:', error);
      return [];
    }
  }

  static async addSavedLocation(
    userId: string,
    location: Omit<SavedLocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<SavedLocation | null> {
    try {
      const locationData = {
        user_id: userId,
        ...location,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      const docRef = doc(collection(db, 'saved_locations'));
      await setDoc(docRef, locationData);

      return { id: docRef.id, ...locationData, created_at: new Date(), updated_at: new Date() };
    } catch (error) {
      console.error('Error adding saved location:', error);
      return null;
    }
  }

  static async updateSavedLocation(
    locationId: string,
    updates: Partial<SavedLocation>
  ): Promise<SavedLocation | null> {
    try {
      const docRef = doc(db, 'saved_locations', locationId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() } as SavedLocation;
      }
      return null;
    } catch (error) {
      console.error('Error updating saved location:', error);
      return null;
    }
  }

  static async deleteSavedLocation(locationId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'saved_locations', locationId));
      return true;
    } catch (error) {
      console.error('Error deleting saved location:', error);
      return false;
    }
  }
}
