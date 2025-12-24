import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseDriver, LocationCoords } from '../types/firebase';

export const driverService = {
  async getDriverProfile(driverId: string): Promise<(FirebaseDriver & { id: string }) | null> {
    const docRef = doc(db, 'drivers', driverId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as FirebaseDriver & { id: string };
    }

    return null;
  },

  async updateDriverLocation(driverId: string, location: LocationCoords): Promise<void> {
    const docRef = doc(db, 'drivers', driverId);
    await updateDoc(docRef, {
      currentLocation: location,
      updatedAt: serverTimestamp()
    });
  },

  async setDriverAvailability(driverId: string, isAvailable: boolean): Promise<void> {
    const docRef = doc(db, 'drivers', driverId);
    await updateDoc(docRef, {
      isAvailable,
      updatedAt: serverTimestamp()
    });
  },

  async setDriverStatus(driverId: string, status: 'online' | 'offline' | 'on-ride'): Promise<void> {
    const docRef = doc(db, 'users', driverId);
    await updateDoc(docRef, {
      driverStatus: status,
      updatedAt: serverTimestamp()
    });
  },

  async updateDriverRating(driverId: string, newRating: number): Promise<void> {
    const docRef = doc(db, 'drivers', driverId);
    const driverSnap = await getDoc(docRef);

    if (driverSnap.exists()) {
      const driver = driverSnap.data() as FirebaseDriver;
      const totalRides = driver.totalRides;
      const currentRating = driver.rating;

      const updatedRating = ((currentRating * totalRides) + newRating) / (totalRides + 1);

      await updateDoc(docRef, {
        rating: updatedRating,
        totalRides: increment(1),
        updatedAt: serverTimestamp()
      });
    }
  },

  async getAvailableDrivers(): Promise<Array<FirebaseDriver & { id: string }>> {
    const q = query(
      collection(db, 'drivers'),
      where('isAvailable', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<FirebaseDriver & { id: string }>;
  }
};
