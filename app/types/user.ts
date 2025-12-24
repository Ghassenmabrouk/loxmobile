export type UserRole = 'client' | 'driver' | 'corporate';
export type SecurityClearance = 'standard' | 'discreet' | 'confidential' | 'critical';
export type AccountType = 'private' | 'corporate';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  userId: string;
  anonymousCode: string;
  role: UserRole;
  pin?: string;
  biometricEnabled: boolean;
  securityClearance: SecurityClearance;
  phoneNumber: string;
  email: string;
  realName: string;
  documentId?: string;
  accountType: AccountType;
  corporateId?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface DriverProfile {
  driverId: string;
  driverCode: string;
  certificationLevel: SecurityClearance;
  certifications: string[];
  backgroundCheck: {
    level: 'basic' | 'enhanced' | 'criminal' | 'security_clearance';
    completedAt: Date;
    expiresAt: Date;
    status: 'valid' | 'expired' | 'pending';
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    luxuryLevel: 'standard' | 'premium' | 'luxury';
    features: string[];
  };
  stats: {
    totalMissions: number;
    completedMissions: number;
    cancelledMissions: number;
    averageRating: number;
    onTimePercentage: number;
    securityIncidents: number;
  };
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  acceptingMissions: boolean;
  maxSecurityLevel: SecurityClearance;
  commissionRate: number;
  subscriptionTier: 'basic' | 'premium' | 'elite';
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CorporateAccount {
  corporateId: string;
  accountCode: string;
  organizationName: string;
  organizationType: 'law_firm' | 'hospital' | 'embassy' | 'government' | 'enterprise';
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  billingType: 'monthly' | 'per_mission' | 'prepaid';
  monthlyAllowance?: number;
  billingEmail: string;
  paymentMethod: string;
  authorizedUsers: string[];
  maxSecurityLevel: SecurityClearance;
  stats: {
    totalMissions: number;
    monthlyMissions: number;
    totalSpent: number;
    averageSecurityLevel: string;
  };
  status: 'active' | 'suspended' | 'trial';
  createdAt: Date;
  contractExpiresAt?: Date;
}