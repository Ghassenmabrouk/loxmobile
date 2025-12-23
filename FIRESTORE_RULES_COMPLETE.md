rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions

    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Check if user is the owner of the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Check if user is admin
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Check if user is driver
    function isDriver() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'driver';
    }

    // Check if user has VIP access level
    function hasVipAccess(requiredLevel) {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      let userVipLevel = userDoc.vipAccess;
      let vipLevels = ['none', 'silver', 'gold', 'diamond'];
      let userLevelIndex = vipLevels.indexOf(userVipLevel);
      let requiredLevelIndex = vipLevels.indexOf(requiredLevel);

      return userLevelIndex >= requiredLevelIndex;
    }

    // Check if VIP access is still valid
    function isVipValid() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userDoc.vipExpiresAt == null || userDoc.vipExpiresAt > request.time;
    }

    // Validate email format
    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }

    // Validate phone number format
    function isValidPhone(phone) {
      return phone.matches('^\\+?[0-9]{10,15}$');
    }

    // Check if user is banned
    function isUserBanned() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return 'isBanned' in userDoc && userDoc.isBanned == true;
    }

    // Validate required fields for users
    function isValidUserData(data) {
      return data.keys().hasAll(['email', 'role']) &&
             isValidEmail(data.email) &&
             data.role in ['user', 'admin', 'driver'];
    }

    // Check if update contains protected fields
    function hasProtectedUserFields() {
      return request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isBanned', 'vipLevel', 'vipAccess', 'vipExpiresAt']);
    }

    // Validate booking dates
    function isValidBookingDates(checkIn, checkOut) {
      return checkIn < checkOut && checkIn >= request.time;
    }

    // Check if user owns a booking
    function isBookingOwner(bookingUserId) {
      return isAuthenticated() && request.auth.uid == bookingUserId;
    }

    // Validate booking status
    function isValidBookingStatus(status) {
      return status in ['pending', 'confirmed', 'cancelled', 'completed'];
    }

    // Check if booking can be modified
    function canModifyBooking() {
      return resource.data.status in ['pending', 'confirmed'] &&
             resource.data.checkIn > request.time;
    }

    // Validate protected booking fields for user updates
    function hasProtectedBookingFields() {
      return request.resource.data.diff(resource.data).affectedKeys()
        .hasAny(['userId', 'hotelId', 'totalPrice', 'createdAt', 'checkIn', 'checkOut', 'guests']);
    }

    // Users Collection
    match /users/{userId} {
      // Allow users to read their own document, admins can read all
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());

      // Allow new user creation during registration
      allow create: if isAuthenticated() &&
                       isOwner(userId) &&
                       isValidUserData(request.resource.data) &&
                       request.resource.data.role in ['user', 'driver'];

      // Users can update their own profile, but not protected fields
      // Admins can update any user including protected fields
      allow update: if isAuthenticated() && (
                       (isOwner(userId) && !hasProtectedUserFields()) ||
                       isAdmin()
                     );

      // Only admins can delete users
      allow delete: if isAdmin();
    }

    // Events Collection
    match /events/{eventId} {
      // All authenticated users can read active events
      // VIP-restricted events require appropriate VIP level
      allow read: if isAuthenticated() &&
                     !isUserBanned() &&
                     (
                       !('vipAccess' in resource.data) ||
                       resource.data.vipAccess == null ||
                       (hasVipAccess(resource.data.vipAccess) && isVipValid())
                     );

      // Only admins can create events
      allow create: if isAdmin() &&
                       request.resource.data.keys().hasAll(['name', 'description', 'date', 'location', 'price', 'category', 'status', 'organizer']) &&
                       request.resource.data.price >= 0 &&
                       request.resource.data.availableSeats >= 0 &&
                       request.resource.data.status in ['Active', 'Cancelled', 'Postponed', 'Completed'];

      // Only admins can update events
      allow update: if isAdmin();

      // Only admins can delete events
      allow delete: if isAdmin();
    }

    // Conversations Collection
    match /conversations/{conversationId} {
      // Users can read conversations they are part of, admins can read all
      allow read: if isAuthenticated() && (
                     request.auth.uid in resource.data.participantIds ||
                     isAdmin()
                   );

      // Authenticated users can create conversations
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.auth.uid in request.resource.data.participantIds &&
                       request.resource.data.keys().hasAll(['participantIds', 'status']);

      // Participants can update conversation status
      allow update: if isAuthenticated() && (
                       request.auth.uid in resource.data.participantIds ||
                       isAdmin()
                     );

      // Only admins can delete conversations
      allow delete: if isAdmin();

      // Messages Subcollection
      match /messages/{messageId} {
        // Participants of the conversation can read messages
        allow read: if isAuthenticated() && (
                       request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds ||
                       isAdmin()
                     );

        // Participants can create messages
        allow create: if isAuthenticated() &&
                         !isUserBanned() &&
                         request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds &&
                         request.resource.data.senderId == request.auth.uid &&
                         request.resource.data.keys().hasAll(['senderId', 'timestamp']);

        // Only mark as read updates allowed by participants
        allow update: if isAuthenticated() &&
                         request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds &&
                         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']);

        // No one can delete messages
        allow delete: if false;
      }
    }

    // Payments Collection
    match /payments/{paymentId} {
      // Users can read their own payments, admins can read all
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     isAdmin()
                   );

      // Users can create payment records for themselves
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'amount', 'paymentMethod', 'status']) &&
                       request.resource.data.amount > 0;

      // No one can update payment records (immutable audit trail)
      allow update: if false;

      // Only admins can delete payment records
      allow delete: if isAdmin();
    }

    // Payment Methods Collection
    match /paymentMethods/{paymentMethodId} {
      // Users can read their own payment methods, admins can read all
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     isAdmin()
                   );

      // Users can create payment methods for themselves
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'type', 'card', 'isDefault', 'createdAt']);

      // Users can update their own payment methods
      allow update: if isAuthenticated() &&
                       !isUserBanned() &&
                       (resource.data.userId == request.auth.uid || isAdmin());

      // Only admins can delete payment methods
      allow delete: if isAdmin();
    }

    // Payment History Collection
    match /paymentHistory/{paymentHistoryId} {
      // Users can read their own payment history, admins can read all
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     isAdmin()
                   );

      // Users can create payment history records for themselves
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'amount', 'currency', 'status', 'paymentIntentId', 'createdAt']);

      // No updates allowed to payment history records
      allow update: if false;

      // Only admins can delete payment history records
      allow delete: if isAdmin();
    }

    // Transfers Collection - UPDATED FOR DRIVER SUPPORT
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
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll([
                         'userId', 'userName', 'userEmail', 'pickupLocation',
                         'dropoffLocation', 'pickupDate', 'pickupTime', 'carType',
                         'passengers', 'price', 'verificationCode', 'status'
                       ]) &&
                       isValidEmail(request.resource.data.userEmail) &&
                       request.resource.data.passengers > 0 &&
                       request.resource.data.passengers <= 8 &&
                       request.resource.data.price > 0 &&
                       request.resource.data.status in ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

      // Users can update their own transfers (limited to status changes to 'cancelled')
      // Drivers can update their assigned transfers (location, status, completion)
      // Admins can update any transfer
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

      // Only admins can delete transfers
      allow delete: if isAdmin();
    }

    // Drivers Collection - UPDATED FOR DRIVER PROFILE MANAGEMENT
    match /drivers/{driverId} {
      // All authenticated users can read driver profiles (for passengers to see driver info)
      allow read: if isAuthenticated() && !isUserBanned();

      // Only admins can create driver profiles
      allow create: if isAdmin() &&
                       request.resource.data.keys().hasAll(['name', 'email', 'phoneNumber', 'carModel', 'carPlate', 'carColor', 'carYear', 'carType', 'rating', 'totalRides', 'isAvailable']);

      // Drivers can update their own profile (location, availability)
      // Admins can update any driver profile
      allow update: if isAuthenticated() && (
                       (isDriver() && isOwner(driverId) &&
                        request.resource.data.diff(resource.data).affectedKeys().hasAny([
                          'currentLocation', 'isAvailable', 'updatedAt'
                        ])) ||
                       isAdmin()
                     );

      // Only admins can delete drivers
      allow delete: if isAdmin();
    }

    // Hotels Collection
    match /hotels/{hotelId} {
      // All authenticated users can read hotels
      allow read: if isAuthenticated() && !isUserBanned();

      // Only admins can create hotels
      allow create: if isAdmin() &&
                       request.resource.data.keys().hasAll(['name', 'location', 'price']);

      // Only admins can update hotels
      allow update: if isAdmin();

      // Only admins can delete hotels
      allow delete: if isAdmin();
    }

    // Hotel Bookings Collection
    match /hotel-bookings/{bookingId} {
      // Users can read their own bookings, admins can read all
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     isAdmin()
                   );

      // Authenticated users can create bookings for themselves
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll([
                         'userId', 'hotelId', 'checkIn', 'checkOut',
                         'guests', 'totalPrice', 'status', 'createdAt'
                       ]) &&
                       isValidBookingDates(request.resource.data.checkIn, request.resource.data.checkOut) &&
                       request.resource.data.guests > 0 &&
                       request.resource.data.totalPrice > 0 &&
                       isValidBookingStatus(request.resource.data.status) &&
                       (
                         !('vipAccess' in request.resource.data) ||
                         request.resource.data.vipAccess == null ||
                         (hasVipAccess(request.resource.data.vipAccess) && isVipValid())
                       );

      // Users can update their own bookings with restrictions
      // Only status changes to 'cancelled' are allowed for users
      // Admins can update any booking and any field
      allow update: if isAuthenticated() && (
                       (
                         isBookingOwner(resource.data.userId) &&
                         canModifyBooking() &&
                         !hasProtectedBookingFields() &&
                         request.resource.data.status == 'cancelled'
                       ) ||
                       isAdmin()
                     );

      // Only admins can delete bookings
      allow delete: if isAdmin();

      // Booking Reviews Subcollection
      match /reviews/{reviewId} {
        // All authenticated users can read reviews
        allow read: if isAuthenticated() && !isUserBanned();

        // Users can create reviews only for their completed bookings
        allow create: if isAuthenticated() &&
                         !isUserBanned() &&
                         get(/databases/$(database)/documents/hotel-bookings/$(bookingId)).data.userId == request.auth.uid &&
                         get(/databases/$(database)/documents/hotel-bookings/$(bookingId)).data.status == 'completed' &&
                         request.resource.data.userId == request.auth.uid &&
                         request.resource.data.keys().hasAll(['userId', 'rating', 'comment', 'createdAt']) &&
                         request.resource.data.rating >= 1 &&
                         request.resource.data.rating <= 5;

        // Users can update their own reviews within 7 days
        allow update: if isAuthenticated() &&
                         resource.data.userId == request.auth.uid &&
                         request.time < resource.data.createdAt + duration.value(7, 'd') &&
                         request.resource.data.userId == resource.data.userId;

        // Only admins can delete reviews
        allow delete: if isAdmin();
      }
    }

    // Restaurants Collection
    match /restaurants/{restaurantId} {
      // All authenticated users can read restaurants
      allow read: if isAuthenticated() && !isUserBanned();

      // Only admins can create restaurants
      allow create: if isAdmin() &&
                       request.resource.data.keys().hasAll(['name', 'location', 'cuisine']);

      // Only admins can update restaurants
      allow update: if isAdmin();

      // Only admins can delete restaurants
      allow delete: if isAdmin();
    }

    // Jobs Collection
    match /jobs/{jobId} {
      // All authenticated users can read job listings
      allow read: if isAuthenticated() && !isUserBanned();

      // Only admins can create jobs
      allow create: if isAdmin() &&
                       request.resource.data.keys().hasAll(['title', 'description', 'location']);

      // Only admins can update jobs
      allow update: if isAdmin();

      // Only admins can delete jobs
      allow delete: if isAdmin();
    }

    // Career Applications Collection
    match /career-applications/{applicationId} {
      // Users can read their own applications, admins can read all
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     isAdmin()
                   );

      // Authenticated users can submit applications
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'name', 'email', 'position']);

      // Applicants cannot update their own applications
      // Only admins can update (e.g., status changes)
      allow update: if isAdmin();

      // Only admins can delete applications
      allow delete: if isAdmin();
    }

    // Pickup Requests Collection
    match /pickup-requests/{requestId} {
      // Users can read their own requests, admins can read all
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     isAdmin()
                   );

      // Authenticated users can create pickup requests
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'pickupLocation', 'dropoffLocation', 'date']);

      // Users cannot update their own requests
      // Only admins can update (e.g., status changes)
      allow update: if isAdmin();

      // Only admins can delete requests
      allow delete: if isAdmin();
    }

    // WhatsApp Messages Collection
    match /whatsapp-messages/{messageId} {
      // Users can read their own messages, admins can read all
      allow read: if isAuthenticated() && (
                     resource.data.userId == request.auth.uid ||
                     isAdmin()
                   );

      // Authenticated users can create messages
      allow create: if isAuthenticated() &&
                       !isUserBanned() &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'message']);

      // Only admins can update messages
      allow update: if isAdmin();

      // Only admins can delete messages
      allow delete: if isAdmin();
    }

    // News Collection
    match /news/{newsId} {
      // All authenticated users can read published news
      allow read: if isAuthenticated() && !isUserBanned();

      // Only admins can create news
      allow create: if isAdmin() &&
                       request.resource.data.keys().hasAll(['title', 'content', 'author', 'publishedDate']);

      // Only admins can update news
      allow update: if isAdmin();

      // Only admins can delete news
      allow delete: if isAdmin();
    }

    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
