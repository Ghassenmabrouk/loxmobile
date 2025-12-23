import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseTransfer, TransferLocation, CarType, TransferStatus } from '../types/firebase';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateQRCodeData(transferId: string, verificationCode: string, userId: string): string {
  return JSON.stringify({
    transferId,
    verificationCode,
    userId,
    timestamp: Date.now()
  });
}

export const transferService = {
  async createTransfer(
    userId: string,
    userName: string,
    userEmail: string,
    userPhone: string,
    pickupLocation: TransferLocation,
    dropoffLocation: TransferLocation,
    pickupDate: Date,
    pickupTime: string,
    carType: CarType,
    passengers: number,
    price: number,
    notes?: string
  ): Promise<string> {
    const verificationCode = generateVerificationCode();

    const transfer: Omit<FirebaseTransfer, 'createdAt' | 'updatedAt' | 'qrCodeData'> & { createdAt: any; updatedAt: any; qrCodeData: string } = {
      userId,
      userName,
      userEmail,
      userPhone,
      pickupLocation,
      dropoffLocation,
      pickupDate: Timestamp.fromDate(pickupDate),
      pickupTime,
      carType,
      passengers,
      price,
      verificationCode,
      qrCodeData: '',
      status: 'pending',
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'transfers'), transfer);

    const qrCodeData = generateQRCodeData(docRef.id, verificationCode, userId);
    await updateDoc(doc(db, 'transfers', docRef.id), {
      qrCodeData,
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  },

  async getUserTransfers(userId: string): Promise<Array<FirebaseTransfer & { id: string }>> {
    const q = query(
      collection(db, 'transfers'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<FirebaseTransfer & { id: string }>;
  },

  async getTransferById(transferId: string): Promise<(FirebaseTransfer & { id: string }) | null> {
    const docRef = doc(db, 'transfers', transferId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as FirebaseTransfer & { id: string };
    }

    return null;
  },

  async getActiveTransfer(userId: string): Promise<(FirebaseTransfer & { id: string }) | null> {
    const q = query(
      collection(db, 'transfers'),
      where('userId', '==', userId),
      where('status', 'in', ['confirmed', 'in-progress']),
      orderBy('pickupDate', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as FirebaseTransfer & { id: string };
  },

  async updateTransferStatus(transferId: string, status: TransferStatus): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  },

  async assignDriver(
    transferId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    driverPhoto?: string,
    driverRating?: number
  ): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      driverId,
      driverName,
      driverPhone,
      driverPhoto,
      driverRating,
      status: 'confirmed',
      updatedAt: serverTimestamp()
    });
  },

  async updateDriverLocation(transferId: string, location: { latitude: number; longitude: number }): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      driverLocation: location,
      updatedAt: serverTimestamp()
    });
  },

  async completeTransfer(
    transferId: string,
    actualDuration: number,
    actualDistance: number
  ): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      status: 'completed',
      actualDuration,
      actualDistance,
      updatedAt: serverTimestamp()
    });
  },

  async cancelTransfer(transferId: string): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  },

  async addRating(transferId: string, rating: number, review?: string): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      rating,
      review,
      updatedAt: serverTimestamp()
    });
  },

  subscribeToTransfer(
    transferId: string,
    callback: (transfer: (FirebaseTransfer & { id: string }) | null) => void
  ): () => void {
    const docRef = doc(db, 'transfers', transferId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as FirebaseTransfer & { id: string });
      } else {
        callback(null);
      }
    });
  },

  subscribeToUserTransfers(
    userId: string,
    callback: (transfers: Array<FirebaseTransfer & { id: string }>) => void
  ): () => void {
    const q = query(
      collection(db, 'transfers'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const transfers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<FirebaseTransfer & { id: string }>;
      callback(transfers);
    });
  },

  async verifyQRCode(scannedData: string, transferId: string): Promise<boolean> {
    try {
      const parsedData = JSON.parse(scannedData);
      const transfer = await transferService.getTransferById(transferId);

      if (!transfer) {
        return false;
      }

      if (
        parsedData.transferId === transferId &&
        parsedData.verificationCode === transfer.verificationCode &&
        parsedData.userId === transfer.userId
      ) {
        await updateDoc(doc(db, 'transfers', transferId), {
          qrCodeScanned: true,
          qrCodeScannedAt: serverTimestamp(),
          status: 'in-progress',
          startTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('QR verification error:', error);
      return false;
    }
  },

  async triggerSOS(transferId: string): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      sosTriggered: true,
      sosTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async getDriverActiveTransfer(driverId: string): Promise<(FirebaseTransfer & { id: string }) | null> {
    const q = query(
      collection(db, 'transfers'),
      where('driverId', '==', driverId),
      where('status', 'in', ['confirmed', 'in-progress']),
      orderBy('pickupDate', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as FirebaseTransfer & { id: string };
  },

  async getDriverPendingTransfers(driverId: string): Promise<Array<FirebaseTransfer & { id: string }>> {
    const q = query(
      collection(db, 'transfers'),
      where('driverId', '==', driverId),
      where('status', '==', 'confirmed'),
      orderBy('pickupDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<FirebaseTransfer & { id: string }>;
  },

  async startRide(transferId: string): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      status: 'in-progress',
      startTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async completeRide(
    transferId: string,
    actualDuration: number,
    actualDistance: number
  ): Promise<void> {
    const docRef = doc(db, 'transfers', transferId);
    await updateDoc(docRef, {
      status: 'completed',
      endTime: serverTimestamp(),
      actualDuration,
      actualDistance,
      updatedAt: serverTimestamp()
    });
  }
};
