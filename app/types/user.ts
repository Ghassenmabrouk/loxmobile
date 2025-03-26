// types/user.ts
export type UserRole = 'user' | 'admin' | 'moderator';
export type UserGender = 'male' | 'female' | 'not specified';
export type VipAccess = 'none' | 'silver' | 'gold' | 'diamond';

export interface User {
  _id: string; // MongoDB uses _id as primary key
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  gender: string;
  photo?: string;
  vipAccess: string;
  vipExpiresAt: Date | null;
}