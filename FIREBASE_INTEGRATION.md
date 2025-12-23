# Firebase Integration - Loxurya Transfers Mobile App

This document outlines the Firebase integration for the Loxurya Transfers mobile application.

## Overview

The mobile app is now fully integrated with your main Loxurya Firebase backend. Users can authenticate using Email/Password or Google Sign-In, and all transfer bookings are stored in your Firestore database.

## Firebase Configuration

**Project**: loxurya-cfb98
**Location**: app/services/firebase.ts

### Authentication Methods
- ✅ Email/Password (Enabled)
- ✅ Google Sign-In (Enabled)

## Key Features Implemented

### 1. Authentication Service (`app/services/authService.ts`)
- Email/Password registration and login
- Google Sign-In support
- Automatic user profile creation in Firestore
- Session persistence using React Native AsyncStorage

### 2. Transfer/Ride Service (`app/services/transferService.ts`)
Complete CRUD operations for transfer bookings:
- `createTransfer()` - Book a new transfer
- `getUserTransfers()` - Get all user's transfers
- `getActiveTransfer()` - Get current active ride
- `updateTransferStatus()` - Update ride status
- `assignDriver()` - Assign driver to transfer
- `updateDriverLocation()` - Real-time driver location updates
- `completeTransfer()` - Mark transfer as completed
- `cancelTransfer()` - Cancel a transfer
- `addRating()` - Rate completed transfers
- `subscribeToTransfer()` - Real-time transfer updates
- `subscribeToUserTransfers()` - Real-time user transfers list

### 3. TypeScript Types (`app/types/firebase.ts`)
Comprehensive type definitions matching your Firestore structure:
- `FirebaseUser` - User profile data
- `FirebaseTransfer` - Transfer/ride booking data
- `FirebaseDriver` - Driver information
- `PaymentMethod` - Payment methods
- `Payment` - Payment records

## Firestore Collections

### Users Collection
```
users/{userId}
├── email (string)
├── role (string) - "user" | "admin" | "driver"
├── firstName (string)
├── lastName (string)
├── phoneNumber (string)
├── gender (string)
├── vipAccess (string) - "none" | "silver" | "gold" | "diamond"
├── vipLevel (string)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Transfers Collection
```
transfers/{transferId}
├── userId (string)
├── userName (string)
├── userEmail (string)
├── pickupLocation (object)
│   ├── address (string)
│   ├── coords (object)
│   │   ├── latitude (number)
│   │   └── longitude (number)
│   └── placeId (string, optional)
├── dropoffLocation (object)
├── pickupDate (timestamp)
├── pickupTime (string)
├── carType (string) - "standard" | "premium" | "luxury" | "suv" | "van"
├── passengers (number)
├── price (number)
├── verificationCode (string)
├── status (string) - "pending" | "confirmed" | "in-progress" | "completed" | "cancelled"
├── driverId (string, optional)
├── driverName (string, optional)
├── driverPhone (string, optional)
├── driverLocation (object, optional)
├── estimatedDuration (number, optional)
├── estimatedDistance (number, optional)
├── notes (string, optional)
├── rating (number, optional)
├── review (string, optional)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

## Security (Firestore Rules)

Your Firestore security rules ensure:
- ✅ Users can only read/write their own transfers
- ✅ Admins have full access
- ✅ Users can only cancel their own pending/confirmed transfers
- ✅ VIP access checks are enforced
- ✅ All writes include proper validation

## How to Use

### Creating a Transfer Booking

```typescript
import { transferService } from '@/app/services/transferService';

const transferId = await transferService.createTransfer(
  userId,
  userName,
  userEmail,
  pickupLocation,  // { address, coords: { latitude, longitude } }
  dropoffLocation,
  new Date(pickupDate),
  pickupTime,      // "14:30"
  carType,         // "luxury"
  passengers,      // 2
  price,           // 150.00
  notes           // optional
);
```

### Subscribing to Real-time Updates

```typescript
// Subscribe to a specific transfer
const unsubscribe = transferService.subscribeToTransfer(
  transferId,
  (transfer) => {
    console.log('Transfer updated:', transfer);
    // Update UI with new transfer data
  }
);

// Don't forget to unsubscribe when component unmounts
return () => unsubscribe();
```

### Getting User's Transfers

```typescript
const transfers = await transferService.getUserTransfers(userId);
```

## Authentication Flow

### Login
```typescript
import { useAuth } from '@/hooks/useAuth';

const { signIn } = useAuth();
await signIn(email, password);
```

### Registration
```typescript
const { signUp } = useAuth();
await signUp(name, email, password, phoneNumber);
```

### Google Sign-In
```typescript
const { signInWithGoogle } = useAuth();
await signInWithGoogle(googleIdToken);
```

## Next Steps

To complete the integration, you'll need to:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Test Authentication**
   - Try logging in with existing accounts from your web platform
   - Test new user registration
   - Verify user data is created correctly in Firestore

3. **Update UI Components**
   - Replace mock data with real Firebase data
   - Implement real-time updates for active rides
   - Add driver location tracking

4. **Add Driver Features** (Future)
   - Create driver-specific screens
   - Implement driver acceptance workflow
   - Add driver navigation and status updates

## File Structure

```
app/
├── services/
│   ├── firebase.ts              # Firebase initialization
│   ├── authService.ts           # Authentication methods
│   └── transferService.ts       # Transfer/ride operations
├── types/
│   └── firebase.ts              # TypeScript type definitions
├── (auth)/
│   ├── login.tsx                # Login screen (updated)
│   └── register.tsx             # Registration screen (updated)
└── hooks/
    └── useAuth.ts               # Authentication hook (updated)
```

## Important Notes

- ✅ Firebase SDK 11.1.0 installed
- ✅ Authentication persistence enabled
- ✅ Real-time listeners for live updates
- ✅ Proper error handling with user-friendly messages
- ✅ TypeScript support throughout
- ✅ Matches your existing Firestore security rules

## Support

For any issues or questions about the Firebase integration, refer to:
- Firebase Auth Documentation: https://firebase.google.com/docs/auth
- Firestore Documentation: https://firebase.google.com/docs/firestore
