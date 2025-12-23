import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { FirebaseUser } from '../types/firebase';

export const adminService = {
  async createDriver(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    licenseNumber: string,
    vehicleModel?: string,
    vehiclePlate?: string
  ): Promise<string> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });

    const driverData: FirebaseUser = {
      email,
      role: 'driver',
      firstName,
      lastName,
      username: firstName.toLowerCase(),
      phoneNumber,
      licenseNumber,
      vehicleModel,
      vehiclePlate,
      driverStatus: 'offline',
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, 'users', user.uid), driverData);

    return user.uid;
  },

  async getAllDrivers(): Promise<Array<FirebaseUser & { id: string }>> {
    const driversQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );

    const snapshot = await getDocs(driversQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseUser & { id: string }));
  },

  async updateDriverStatus(driverId: string, status: 'online' | 'offline' | 'busy'): Promise<void> {
    await setDoc(
      doc(db, 'users', driverId),
      { driverStatus: status, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
};
