# Updated Firestore Rules for Driver Support

Add these rules to your Firestore to support driver functionality in the mobile app:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isDriver() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'driver';
    }

    function isUserBanned() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return 'isBanned' in userDoc && userDoc.isBanned == true;
    }

    // Users Collection - EXISTING (keep as is)
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAdmin();
    }

    // Transfers Collection - UPDATED
    match /transfers/{transferId} {
      // Users can read their own transfers
      // Drivers can read transfers assigned to them
      // Admins can read all transfers
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     resource.data.driverId == request.auth.uid ||
                     isAdmin()
                   );

      // Authenticated users can create transfers for themselves
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid;

      // Users can update status to 'cancelled'
      // Drivers can update their assigned transfers (location, status, completion)
      // Admins can update everything
      allow update: if isAuthenticated() && (
                       // User cancelling their own transfer
                       (
                         resource.data.userId == request.auth.uid &&
                         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt']) &&
                         request.resource.data.status == 'cancelled' &&
                         resource.data.status in ['pending', 'confirmed']
                       ) ||
                       // Driver updating assigned transfer
                       (
                         isDriver() &&
                         resource.data.driverId == request.auth.uid &&
                         request.resource.data.diff(resource.data).affectedKeys().hasAny([
                           'status', 'driverLocation', 'actualDuration', 'actualDistance',
                           'startTime', 'endTime', 'updatedAt', 'qrCodeScanned', 'qrCodeScannedAt'
                         ])
                       ) ||
                       // Admin can update anything
                       isAdmin()
                     );

      allow delete: if isAdmin();
    }

    // Drivers Collection - NEW
    match /drivers/{driverId} {
      // All authenticated users can read driver profiles (for passenger to see driver info)
      allow read: if isAuthenticated() && !isUserBanned();

      // Only admins can create driver profiles
      allow create: if isAdmin();

      // Drivers can update their own profile (location, availability)
      // Admins can update any driver profile
      allow update: if isAuthenticated() && (
                       (isDriver() && isOwner(driverId)) ||
                       isAdmin()
                     );

      // Only admins can delete drivers
      allow delete: if isAdmin();
    }

    // (Keep all other existing collections as they are)
  }
}
```

## Key Changes

1. **Added `isDriver()` helper function** - Checks if user has 'driver' role
2. **Updated Transfers read permissions** - Drivers can read transfers assigned to them
3. **Updated Transfers update permissions** - Drivers can update:
   - Transfer status (confirmed → in-progress → completed)
   - Driver location (real-time tracking)
   - Actual duration and distance
   - QR code verification fields
4. **Added Drivers collection rules** - Separate collection for driver profiles

## Apply These Rules

Copy the rules above and paste them into your Firebase Console:
1. Go to Firebase Console → Firestore Database
2. Click on "Rules" tab
3. Replace with the updated rules
4. Click "Publish"
