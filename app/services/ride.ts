import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export const RideService = {
  createRide: async (rideData: any) => {
    try {
      const ridesRef = collection(db, 'rides');
      const docRef = await addDoc(ridesRef, {
        ...rideData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        id: docRef.id,
        ...rideData
      };
    } catch (error) {
      console.error('Error creating ride:', error);
      throw error;
    }
  },

  getUserRides: async (userId: string) => {
    try {
      const ridesRef = collection(db, 'rides');
      const q = query(
        ridesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const rides = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return rides;
    } catch (error) {
      console.error('Error fetching user rides:', error);
      throw error;
    }
  },

  updateRide: async (rideId: string, updates: any) => {
    try {
      const rideRef = doc(db, 'rides', rideId);
      await updateDoc(rideRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      return { id: rideId, ...updates };
    } catch (error) {
      console.error('Error updating ride:', error);
      throw error;
    }
  },

  deleteRide: async (rideId: string) => {
    try {
      const rideRef = doc(db, 'rides', rideId);
      await deleteDoc(rideRef);
    } catch (error) {
      console.error('Error deleting ride:', error);
      throw error;
    }
  }
};