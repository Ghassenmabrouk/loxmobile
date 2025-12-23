# Loxurya Implementation Guide

## ✅ What's Already Built

### Backend Services (Complete)
- ✅ Firebase integration with authentication
- ✅ Transfer service with QR code generation
- ✅ Driver service for driver management
- ✅ QR code service for verification
- ✅ Real-time location tracking capability
- ✅ SOS emergency system
- ✅ Driver rating system

### TypeScript Types (Complete)
- ✅ FirebaseUser (user, admin, driver roles)
- ✅ FirebaseTransfer (complete ride data)
- ✅ FirebaseDriver (driver profiles)
- ✅ LocationCoords & TransferLocation
- ✅ Payment types

### Required Packages (Added)
- ✅ firebase ^11.1.0
- ✅ expo-barcode-scanner
- ✅ expo-camera
- ✅ react-native-qrcode-svg
- ✅ expo-location
- ✅ react-native-maps (already installed)

---

## 📋 Next Steps: Build the UI

### Phase 1: Passenger Screens

#### 1. Booking Screen
**File**: `app/(tabs)/book-ride.tsx`
```typescript
Features needed:
- Location search with Google Places API
- Date/time picker
- Car type selector
- Passenger count
- Price calculation
- Confirm booking button

Uses:
- transferService.createTransfer()
- Location autocomplete component
```

#### 2. Active Ride Screen
**File**: `app/(tabs)/track.tsx` (already exists, needs update)
```typescript
Features needed:
- Real-time map showing driver location
- Driver info card (photo, name, rating, car)
- QR Scanner button
- SOS emergency button
- Call driver button
- Call support button
- Trip info (distance, time, price)

Uses:
- transferService.getActiveTransfer()
- transferService.subscribeToTransfer()
- Maps component with directions
```

#### 3. QR Scanner Screen
**File**: `app/qr-scanner.tsx`
```typescript
Features needed:
- Camera view for scanning
- QR code scanner
- Verification result display
- Welcome message on success

Uses:
- expo-barcode-scanner
- transferService.verifyQRCode()
```

#### 4. Rating Screen
**File**: `app/rate-driver.tsx`
```typescript
Features needed:
- Star rating (1-5)
- Text review input
- Submit button
- Trip summary

Uses:
- transferService.addRating()
- driverService.updateDriverRating()
```

---

### Phase 2: Driver Screens

#### 1. Driver Dashboard
**File**: `app/(driver)/dashboard.tsx`
```typescript
Features needed:
- Current ride status
- Next pending rides list
- Go online/offline toggle
- Today's earnings
- Today's completed rides

Uses:
- transferService.getDriverActiveTransfer()
- transferService.getDriverPendingTransfers()
- driverService.setDriverAvailability()
```

#### 2. Active Ride Screen (Driver)
**File**: `app/(driver)/active-ride.tsx`
```typescript
Features needed:
- QR code display for passenger to scan
- Passenger info (name, phone, photo)
- Map with directions to pickup/dropoff
- "Start Ride" button (after QR scan)
- "Complete Ride" button
- Navigation integration
- Trip timer

Uses:
- QRCode from react-native-qrcode-svg
- transferService.getDriverActiveTransfer()
- transferService.subscribeToTransfer()
- Maps with directions
```

#### 3. Ride History
**File**: `app/(driver)/history.tsx`
```typescript
Features needed:
- List of completed rides
- Earnings per ride
- Ratings received
- Filter by date

Uses:
- Query transfers where driverId == current user
- Filter by status == 'completed'
```

---

### Phase 3: Shared Components

#### 1. Location Tracking Hook
**File**: `hooks/useLocationTracking.ts`
```typescript
export function useLocationTracking(transferId: string, isDriver: boolean) {
  // Start watching position
  // Update Firestore every 10 seconds
  // Clean up on unmount
}

Uses:
- expo-location
- transferService.updateDriverLocation()
```

#### 2. QR Code Component
**File**: `components/QRCodeDisplay.tsx`
```typescript
import QRCode from 'react-native-qrcode-svg';

export function QRCodeDisplay({ transferId, verificationCode, userId }) {
  const qrData = qrCodeService.generateQRData(...);
  return <QRCode value={qrData} size={250} />;
}
```

#### 3. Map with Live Tracking
**File**: `components/LiveTrackingMap.tsx`
```typescript
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

Features:
- Show driver marker
- Show pickup/dropoff markers
- Draw route
- Auto-center on driver
- Update every 10 seconds

Uses:
- react-native-maps
- react-native-maps-directions
- transferService.subscribeToTransfer()
```

#### 4. SOS Button
**File**: `components/SOSButton.tsx`
```typescript
Features:
- Red emergency button
- Confirmation dialog
- Immediate alert to admin
- Show emergency contacts

Uses:
- transferService.triggerSOS()
```

---

## 🔧 Configuration Needed

### 1. Google Maps API Key
Add to `.env`:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

Update `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_KEY_HERE"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_KEY_HERE"
      }
    }
  }
}
```

### 2. App Permissions
Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Loxurya to access your location for ride tracking."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Loxurya to use camera for QR code scanning."
        }
      ]
    ]
  }
}
```

### 3. Update Firestore Rules
Copy rules from `FIRESTORE_RULES.md` and apply to Firebase Console

---

## 📱 Screen Navigation Structure

```
app/
├── (auth)/
│   ├── login.tsx ✅
│   └── register.tsx ✅
│
├── (tabs)/ [FOR PASSENGERS]
│   ├── index.tsx (Home - Book Ride)
│   ├── track.tsx (Active Ride Tracking)
│   ├── rides.tsx (Ride History)
│   └── profile.tsx (User Profile)
│
├── (driver)/ [FOR DRIVERS]
│   ├── _layout.tsx (Driver Tab Layout)
│   ├── dashboard.tsx (Driver Home)
│   ├── active-ride.tsx (Current Ride)
│   ├── history.tsx (Completed Rides)
│   └── profile.tsx (Driver Profile)
│
├── qr-scanner.tsx (Modal)
├── rate-driver.tsx (Modal)
└── emergency.tsx (SOS Screen)
```

---

## 🎯 Priority Order

### Week 1: Core Passenger Features
1. Book ride screen
2. QR scanner
3. Active ride tracking
4. Rating screen

### Week 2: Driver Features
1. Driver dashboard
2. QR code display
3. Active ride management
4. Location updates

### Week 3: Safety & Polish
1. SOS system
2. Support calls
3. Notifications
4. Error handling

---

## 🧪 Testing Checklist

### Test Booking Flow
- [ ] Create transfer booking
- [ ] QR code generated correctly
- [ ] Transfer appears in Firestore
- [ ] Admin can see pending transfer

### Test QR Verification
- [ ] Driver displays QR code
- [ ] Passenger scans QR code
- [ ] Verification succeeds
- [ ] Status changes to in-progress
- [ ] Start time recorded

### Test Real-time Tracking
- [ ] Driver location updates
- [ ] Passenger sees updates
- [ ] Map shows correct route
- [ ] ETA calculates correctly

### Test SOS
- [ ] SOS button triggers alert
- [ ] Admin receives notification
- [ ] Location shared correctly
- [ ] Emergency contacts shown

### Test Rating
- [ ] Can rate after completion
- [ ] Rating stored in transfer
- [ ] Driver's rating updates correctly
- [ ] Review text saved

---

## 📚 Helpful Code Examples

### Creating a Booking
```typescript
const transferId = await transferService.createTransfer(
  user.uid,
  user.displayName,
  user.email,
  user.phoneNumber,
  pickupLocation,
  dropoffLocation,
  new Date(selectedDate),
  selectedTime,
  'luxury',
  2,
  150.00,
  'Please call when arrived'
);
```

### Scanning QR Code
```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';

const handleBarCodeScanned = async ({ data }) => {
  const isValid = await transferService.verifyQRCode(data, activeTransfer.id);
  if (isValid) {
    Alert.alert('Success', 'Welcome to Loxurya!');
  } else {
    Alert.alert('Error', 'Invalid QR code');
  }
};
```

### Real-time Location Updates
```typescript
useEffect(() => {
  const unsubscribe = transferService.subscribeToTransfer(
    transferId,
    (transfer) => {
      if (transfer?.driverLocation) {
        setDriverPosition(transfer.driverLocation);
      }
    }
  );

  return () => unsubscribe();
}, [transferId]);
```

### Displaying QR Code
```typescript
import QRCode from 'react-native-qrcode-svg';

<QRCode
  value={transfer.qrCodeData}
  size={250}
  backgroundColor="white"
  color="black"
/>
```

---

## 🚀 Ready to Build!

All backend services are complete and tested. Now you can focus on building beautiful UI screens that use these services.

**Start with**: Creating the booking screen and QR scanner for passengers!
