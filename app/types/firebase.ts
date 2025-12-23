import { Timestamp } from 'firebase/firestore';

export type VipLevel = 'none' | 'silver' | 'gold' | 'diamond';
export type UserRole = 'user' | 'admin' | 'driver';
export type Gender = 'male' | 'female' | 'other';

export interface FirebaseUser {
  email: string;
  role: UserRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  firstName?: string;
  lastName?: string;
  username?: string;
  name?: string;
  phoneNumber?: string;
  gender?: Gender;
  photo?: string;
  vipAccess?: VipLevel;
  vipLevel?: VipLevel;
  vipExpiresAt?: Timestamp | null;
  isBanned?: boolean;
  licenseNumber?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  driverStatus?: 'online' | 'offline' | 'busy';
}

export type TransferStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
export type CarType = 'standard' | 'premium' | 'luxury' | 'suv' | 'van';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface TransferLocation {
  address: string;
  coords: LocationCoords;
  placeId?: string;
}

export interface FirebaseTransfer {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  pickupLocation: TransferLocation;
  dropoffLocation: TransferLocation;
  pickupDate: Timestamp;
  pickupTime: string;
  carType: CarType;
  passengers: number;
  price: number;
  verificationCode: string;
  qrCodeData: string;
  status: TransferStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  driverRating?: number;
  driverLocation?: LocationCoords;
  qrCodeScanned?: boolean;
  qrCodeScannedAt?: Timestamp;
  startTime?: Timestamp;
  endTime?: Timestamp;
  estimatedDuration?: number;
  estimatedDistance?: number;
  actualDuration?: number;
  actualDistance?: number;
  notes?: string;
  rating?: number;
  review?: string;
  sosTriggered?: boolean;
  sosTimestamp?: Timestamp;
}

export interface FirebaseDriver {
  name: string;
  email: string;
  phoneNumber: string;
  experience: number;
  rating: number;
  totalRides: number;
  carModel: string;
  carPlate: string;
  carColor: string;
  carYear: number;
  carType: CarType;
  photo?: string;
  isAvailable: boolean;
  currentLocation?: LocationCoords;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentMethod {
  userId: string;
  type: 'card' | 'bank' | 'mobile';
  card: {
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface Payment {
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  transferId?: string;
  paymentIntentId?: string;
  createdAt: Timestamp;
}
