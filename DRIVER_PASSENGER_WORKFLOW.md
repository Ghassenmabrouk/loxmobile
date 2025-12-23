# Loxurya Driver-Passenger Workflow

## Complete Ride Flow with QR Code Verification

This document explains the complete workflow for the Loxurya transfer system, including driver tablet app, passenger mobile app, and QR code verification.

## System Overview

### User Roles
1. **Passenger (User)** - Books rides, scans QR codes, tracks driver
2. **Driver** - Accepts rides, shows QR code, drives passengers
3. **Admin** - Manages users, drivers, and monitors system

### Devices
- **Passenger**: Mobile phone with Loxurya app
- **Driver**: Tablet in car with Loxurya app
- **Admin**: Web dashboard (separate system)

---

## Complete Ride Workflow

### Step 1: Passenger Books a Ride
```
1. Passenger opens Loxurya app
2. Enters pickup location (GPS coordinates + address)
3. Enters dropoff location
4. Selects car type (Standard, Premium, Luxury, SUV, Van)
5. Chooses date and time
6. Confirms booking
7. System generates:
   - Unique verification code (6 digits)
   - QR code data (transferId + code + userId + timestamp)
8. Transfer status: PENDING
```

### Step 2: Admin Assigns Driver
```
1. Admin sees new transfer request in dashboard
2. Admin selects available driver
3. System updates transfer:
   - Adds driverId, driverName, driverPhone
   - Adds driver photo and rating
   - Changes status: PENDING → CONFIRMED
4. Driver receives notification on tablet
5. Passenger receives notification with driver details
```

### Step 3: Driver Prepares for Pickup
```
Driver Tablet Shows:
- Passenger name and phone
- Pickup location with map/directions
- Pickup time
- Car type requested
- QR code for verification
- Passenger photo (if available)

Driver Actions:
- Enables real-time location sharing
- Navigates to pickup location
- Status remains: CONFIRMED
```

### Step 4: Passenger Tracks Driver
```
Passenger App Shows:
- Driver is on the way
- Driver photo, name, rating
- Car details (model, color, plate)
- Real-time driver location on map
- Estimated time of arrival
- Call driver button
- SOS emergency button
```

### Step 5: QR Code Verification at Pickup

**CRITICAL SECURITY STEP**

```
1. Driver arrives at pickup location
2. Driver shows tablet screen to passenger
3. Tablet displays QR code containing:
   {
     "transferId": "abc123",
     "verificationCode": "123456",
     "userId": "user789",
     "timestamp": 1703260800000
   }

4. Passenger opens Loxurya app
5. Passenger taps "Scan Driver QR Code"
6. Passenger scans QR code on driver's tablet
7. System verifies:
   ✓ TransferId matches booking
   ✓ Verification code matches
   ✓ UserId matches passenger
   ✓ QR code is recent (< 60 minutes old)

8. If ALL checks pass:
   ✓ App shows "Welcome to Loxurya!"
   ✓ Passenger sees driver details confirmed
   ✓ Status: CONFIRMED → IN-PROGRESS
   ✓ Ride start time recorded
   ✓ Real-time tracking begins

9. If verification FAILS:
   ✗ App shows "Invalid QR Code"
   ✗ Passenger can try again or contact support
   ✗ Admin receives alert
```

### Step 6: During the Ride

**Passenger App Features:**
```
✓ Real-time location tracking
✓ Route to destination shown
✓ Driver location updates every 10 seconds
✓ Estimated time remaining
✓ Current speed (optional)
✓ Trip summary (distance, duration)
✓ SOS Emergency Button
✓ Call Loxurya Support
✓ Rate driver option (prepared for end)
```

**Driver Tablet Features:**
```
✓ Turn-by-turn navigation
✓ Current trip details
✓ Passenger contact info
✓ Trip timer
✓ Complete ride button
✓ Emergency contact
```

**System Updates:**
```
- Driver location updated every 10 seconds
- All updates synced to Firestore
- Passenger sees updates in real-time
- Admin can monitor live rides
```

### Step 7: Emergency SOS Feature

If passenger triggers SOS:
```
1. Passenger presses SOS button
2. App immediately:
   - Records SOS timestamp in Firestore
   - Sends alert to admin dashboard
   - Shares live location
   - Shows emergency contacts
   - Option to call police/ambulance
3. Admin receives HIGH PRIORITY alert
4. Admin can:
   - Call passenger immediately
   - Call driver
   - Track exact location
   - Dispatch help
```

### Step 8: Completing the Ride
```
1. Driver arrives at destination
2. Driver taps "Complete Ride"
3. System records:
   - End time
   - Actual duration
   - Actual distance
   - Status: IN-PROGRESS → COMPLETED
4. Passenger app shows:
   - "Trip Completed"
   - Trip summary
   - Total cost
   - Rate your driver screen
```

### Step 9: Driver Rating
```
Passenger Rates Driver (1-5 stars):
- Service quality
- Driving safety
- Vehicle cleanliness
- Professionalism
- Optional written review

System Updates:
- Stores rating in transfer record
- Updates driver's overall rating
- Calculation: ((old_rating × total_rides) + new_rating) / (total_rides + 1)
- Bad ratings flagged for admin review
- Excellent ratings highlighted
```

---

## Data Structure

### Transfer Document (Firestore)
```javascript
{
  // Passenger Info
  userId: "user123",
  userName: "John Doe",
  userEmail: "john@example.com",
  userPhone: "+1234567890",

  // Location Data
  pickupLocation: {
    address: "123 Main St, City",
    coords: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    placeId: "ChIJ..."
  },
  dropoffLocation: { /* same structure */ },

  // Booking Details
  pickupDate: Timestamp,
  pickupTime: "14:30",
  carType: "luxury",
  passengers: 2,
  price: 150.00,

  // Verification
  verificationCode: "123456",
  qrCodeData: "{...json...}",
  qrCodeScanned: true,
  qrCodeScannedAt: Timestamp,

  // Driver Info
  driverId: "driver456",
  driverName: "Mike Smith",
  driverPhone: "+1987654321",
  driverPhoto: "https://...",
  driverRating: 4.8,
  driverLocation: {
    latitude: 40.7128,
    longitude: -74.0060
  },

  // Status & Timing
  status: "in-progress",
  startTime: Timestamp,
  endTime: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Trip Metrics
  estimatedDuration: 1800, // seconds
  estimatedDistance: 15.5, // km
  actualDuration: 1920,
  actualDistance: 16.2,

  // Safety
  sosTriggered: false,
  sosTimestamp: null,

  // Review
  rating: 5,
  review: "Excellent service!",

  // Optional
  notes: "Please call when arrived"
}
```

---

## Security Features

### 1. QR Code Verification
- ✅ Ensures right driver picks up right passenger
- ✅ Prevents unauthorized drivers
- ✅ Time-limited QR codes (60 min expiry)
- ✅ Unique per transfer
- ✅ Can't be reused

### 2. Real-time Tracking
- ✅ Passenger knows exact driver location
- ✅ Admin can monitor all active rides
- ✅ SOS immediately shares location
- ✅ Route deviations can be detected

### 3. Driver Verification
- ✅ Only approved drivers in system
- ✅ Driver ratings visible to passengers
- ✅ Photo verification
- ✅ Car details verified

### 4. Emergency System
- ✅ One-tap SOS button
- ✅ Instant admin notification
- ✅ Location sharing
- ✅ Call support directly
- ✅ Emergency services access

---

## Firebase Services

### transferService.ts
- `createTransfer()` - Create booking with QR code
- `verifyQRCode()` - Verify driver QR code
- `getActiveTransfer()` - Get passenger's active ride
- `getDriverActiveTransfer()` - Get driver's active ride
- `updateDriverLocation()` - Update driver position
- `startRide()` - Begin trip after QR scan
- `completeRide()` - End trip
- `triggerSOS()` - Emergency alert
- `addRating()` - Rate completed ride
- `subscribeToTransfer()` - Real-time updates

### driverService.ts
- `getDriverProfile()` - Get driver details
- `updateDriverLocation()` - Update driver GPS
- `setDriverAvailability()` - Online/offline status
- `updateDriverRating()` - Recalculate rating
- `getAvailableDrivers()` - List available drivers

### qrCodeService.ts
- `generateQRData()` - Create QR payload
- `parseQRData()` - Parse scanned QR
- `isQRDataValid()` - Check QR expiry

---

## Required Packages

Add to package.json:
```json
{
  "expo-barcode-scanner": "~14.0.3",
  "expo-camera": "~16.0.10",
  "react-native-qrcode-svg": "^6.3.2",
  "expo-location": "~19.0.8"
}
```

---

## Admin Dashboard Features (Web)

The admin needs to be able to:

1. **Monitor Active Rides**
   - See all in-progress transfers
   - Real-time driver locations on map
   - Passenger details
   - Trip duration and distance

2. **Assign Drivers**
   - View pending transfer requests
   - See available drivers
   - Manually assign driver to transfer
   - Send notifications

3. **Handle SOS Alerts**
   - Receive instant notifications
   - See exact location
   - Call passenger/driver
   - Dispatch emergency services

4. **Manage Drivers**
   - View all drivers
   - See ratings and reviews
   - Approve/suspend drivers
   - View driver history

5. **Manage Users**
   - View all passengers
   - See booking history
   - Handle complaints
   - Manage VIP status

6. **Review System**
   - See all ratings
   - Read reviews
   - Identify bad drivers
   - Reward excellent drivers

---

## Next Implementation Steps

1. ✅ Update Firestore rules (see FIRESTORE_RULES.md)
2. ✅ Install required packages
3. Create driver screens:
   - Driver login
   - Active ride view
   - QR code display
   - Navigation
4. Create passenger screens:
   - QR scanner
   - Live tracking map
   - Driver info display
   - SOS button
5. Implement real-time location updates
6. Add rating screen
7. Test complete workflow

---

## Support Contacts

**Emergency SOS**: Alerts admin + option to call emergency services
**Loxurya Support**: In-app call button to support team
**Driver Support**: Driver can call support if issues arise
