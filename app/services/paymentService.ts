import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export interface CardDetails {
  brand: string;
  expMonth: number;
  expYear: number;
  last4: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: string;
  card: CardDetails;
  isDefault: boolean;
  createdAt: any;
  updatedAt: any;
}

export class PaymentService {
  static async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const q = query(
        collection(db, 'paymentMethods'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const methods: PaymentMethod[] = [];

      querySnapshot.forEach((doc) => {
        methods.push({
          id: doc.id,
          ...doc.data(),
        } as PaymentMethod);
      });

      return methods.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  static async addPaymentMethod(
    userId: string,
    cardDetails: CardDetails,
    setAsDefault: boolean = false
  ): Promise<PaymentMethod | null> {
    try {
      const batch = writeBatch(db);

      if (setAsDefault) {
        const existingMethods = await this.getPaymentMethods(userId);
        for (const method of existingMethods) {
          if (method.isDefault) {
            const methodRef = doc(db, 'paymentMethods', method.id);
            batch.update(methodRef, { isDefault: false, updatedAt: serverTimestamp() });
          }
        }
      }

      await batch.commit();

      const docRef = await addDoc(collection(db, 'paymentMethods'), {
        userId,
        type: 'card',
        card: cardDetails,
        isDefault: setAsDefault,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const newMethod: PaymentMethod = {
        id: docRef.id,
        userId,
        type: 'card',
        card: cardDetails,
        isDefault: setAsDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      return null;
    }
  }

  static async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<boolean> {
    try {
      const batch = writeBatch(db);

      const existingMethods = await this.getPaymentMethods(userId);
      for (const method of existingMethods) {
        const methodRef = doc(db, 'paymentMethods', method.id);
        if (method.id === paymentMethodId) {
          batch.update(methodRef, { isDefault: true, updatedAt: serverTimestamp() });
        } else if (method.isDefault) {
          batch.update(methodRef, { isDefault: false, updatedAt: serverTimestamp() });
        }
      }

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  }

  static async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'paymentMethods', paymentMethodId));
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }

  static getCardBrandIcon(brand: string): string {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
      case 'american express':
        return 'card';
      case 'discover':
        return 'card';
      default:
        return 'card';
    }
  }

  static formatCardBrand(brand: string): string {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
      case 'american express':
        return 'American Express';
      case 'discover':
        return 'Discover';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }

  static isCardExpired(expMonth: number, expYear: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expYear < currentYear) return true;
    if (expYear === currentYear && expMonth < currentMonth) return true;
    return false;
  }
}
