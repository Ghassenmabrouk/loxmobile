# ON TIME - Firebase/Firestore Database Schema
## Anonymous, Secure, Mission-Based Architecture

---

## 🎯 CORE PRINCIPLES

1. **Anonymous by Design** - No real names in mission-accessible data
2. **Compartmentalized Access** - Drivers see only what they need
3. **Security Levels** - 4-tier system controls everything
4. **Audit Trail** - Complete, immutable tracking
5. **GDPR Compliant** - Minimal data, encrypted, EU hosting

---

## 📊 FIRESTORE COLLECTIONS

### 1️⃣ **users** (Root Collection)
**Purpose:** Core user identity and authentication

```typescript
/users/{userId}
{
  // Identity
  userId: string;              // Firebase Auth UID
  anonymousCode: string;       // "OT-A9F7X" - UNIQUE
  role: 'client' | 'driver' | 'admin' | 'corporate';

  // Security
  pin: string;                 // Hashed PIN
  biometricEnabled: boolean;
  securityClearance: 'standard' | 'discreet' | 'confidential' | 'critical';

  // Contact (encrypted, never shown in missions)
  phoneNumber: string;         // Encrypted
  email: string;               // Encrypted

  // Real Identity (encrypted, admin only)
  realName: string;            // Encrypted, never shown to drivers
  documentId: string;          // Passport/ID - encrypted

  // Account
  accountType: 'private' | 'corporate';
  corporateId?: string;        // Link to corporate account
  status: 'active' | 'suspended' | 'pending';

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}
```

**Firebase Security Rules:**
```javascript
// Only user can read their own data
// Only admin can see encrypted real identity
```

---

### 2️⃣ **missions** (Root Collection)
**Purpose:** Core mission data - replaces "rides"

```typescript
/missions/{missionId}
{
  // Mission Identity
  missionId: string;           // Unique mission ID
  missionCode: string;         // "M-X7K9P" - shown to driver

  // Type
  type: 'person' | 'document';
  securityLevel: '🟢standard' | '🔵discreet' | '🟠confidential' | '🔴critical';

  // Parties (anonymous references)
  clientId: string;            // User ID
  clientCode: string;          // "OT-A9F7X" - shown to driver
  driverId: string;            // User ID
  driverCode: string;          // "DR-B4C2N"

  // Location
  pickup: {
    address: string;
    coordinates: GeoPoint;
    timestamp: Timestamp;
  };
  dropoff: {
    address: string;
    coordinates: GeoPoint;
    timestamp: Timestamp;
  };

  // Timing
  requestedAt: Timestamp;
  scheduledFor: Timestamp;
  driverDepartedAt?: Timestamp;
  driverArrivedAt?: Timestamp;
  missionStartedAt?: Timestamp;
  missionCompletedAt?: Timestamp;
  estimatedDuration: number;   // minutes
  actualDuration?: number;     // minutes

  // Status
  status: 'pending' | 'assigned' | 'driver_en_route' | 'driver_arrived' |
          'in_progress' | 'completed' | 'cancelled' | 'failed';

  // Pricing
  basePrice: number;
  securityPremium: number;
  totalPrice: number;
  currency: string;            // 'EUR'

  // Confirmation
  confirmationMethod: 'qr' | 'nfc' | 'pin' | 'visual';
  confirmationCode: string;    // Generated for verification
  confirmedAt?: Timestamp;

  // Document-specific (if type === 'document')
  documentDetails?: {
    documentType: 'legal' | 'medical' | 'diplomatic' | 'corporate' | 'confidential';
    sealedPackage: boolean;
    scanAtPickup?: string;     // Image URL
    scanAtDelivery?: string;   // Image URL
    recipientName?: string;    // Optional, encrypted
    recipientCode?: string;    // Anonymous code for recipient
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 3️⃣ **missionTracking** (Root Collection)
**Purpose:** Real-time location and status updates

```typescript
/missionTracking/{missionId}
{
  missionId: string;
  driverId: string;

  // Real-time Location
  currentLocation: {
    coordinates: GeoPoint;
    heading: number;           // Direction in degrees
    speed: number;             // km/h
    accuracy: number;          // meters
    timestamp: Timestamp;
  };

  // ETA Calculation
  estimatedArrival: Timestamp;
  distanceRemaining: number;   // meters
  timeRemaining: number;       // minutes

  // Route
  plannedRoute: GeoPoint[];    // Array of coordinates
  actualRoute: GeoPoint[];     // Actual path taken

  // Anomalies
  deviations: Array<{
    timestamp: Timestamp;
    deviation: number;         // meters off route
    reason?: string;
  }>;

  suspiciousStops: Array<{
    timestamp: Timestamp;
    duration: number;          // minutes
    location: GeoPoint;
    flagged: boolean;
  }>;

  // Status
  isActive: boolean;
  lastUpdateAt: Timestamp;
}
```

---

### 4️⃣ **securityLevels** (Root Collection)
**Purpose:** Configuration for 4-tier security system

```typescript
/securityLevels/{levelId}
{
  levelId: 'standard' | 'discreet' | 'confidential' | 'critical';

  // Display
  icon: '🟢' | '🔵' | '🟠' | '🔴';
  name: string;
  description: string;

  // Pricing
  priceMultiplier: number;     // 1.0, 1.5, 2.0, 3.0

  // Requirements
  driverRequirements: {
    minimumRating: number;
    certificationRequired: boolean;
    backgroundCheckLevel: 'basic' | 'enhanced' | 'criminal' | 'security_clearance';
    experienceMinimum: number; // missions completed
  };

  vehicleRequirements: {
    luxuryLevel: 'standard' | 'premium' | 'luxury';
    tintedWindows: boolean;
    secureCompartment: boolean;
  };

  // Features
  features: {
    enhancedLogging: boolean;
    dedicatedSupport: boolean;
    priorityAssignment: boolean;
    anomalyMonitoring: boolean;
    legalReport: boolean;
  };

  // Access
  availableToPublic: boolean;
  requiresPreApproval: boolean;
}
```

---

### 5️⃣ **driverProfiles** (Root Collection)
**Purpose:** Driver certification and performance

```typescript
/driverProfiles/{driverId}
{
  driverId: string;
  driverCode: string;          // "DR-B4C2N"

  // Certification
  certificationLevel: 'basic' | 'discreet' | 'confidential' | 'critical';
  certifications: string[];    // ['security_trained', 'diplomatic_cleared']
  backgroundCheck: {
    level: 'basic' | 'enhanced' | 'criminal' | 'security_clearance';
    completedAt: Timestamp;
    expiresAt: Timestamp;
    status: 'valid' | 'expired' | 'pending';
  };

  // Vehicle
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;      // Encrypted
    luxuryLevel: 'standard' | 'premium' | 'luxury';
    features: string[];        // ['tinted_windows', 'secure_compartment']
  };

  // Performance
  stats: {
    totalMissions: number;
    completedMissions: number;
    cancelledMissions: number;
    averageRating: number;
    onTimePercentage: number;
    securityIncidents: number;
  };

  // Availability
  isOnline: boolean;
  currentLocation?: GeoPoint;
  acceptingMissions: boolean;
  maxSecurityLevel: 'standard' | 'discreet' | 'confidential' | 'critical';

  // Financials
  commissionRate: number;      // Percentage
  subscriptionTier: 'basic' | 'premium' | 'elite';

  // Status
  status: 'active' | 'suspended' | 'pending_review';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 6️⃣ **missionLogs** (Root Collection)
**Purpose:** Immutable audit trail

```typescript
/missionLogs/{logId}
{
  logId: string;
  missionId: string;

  // Event
  eventType: 'created' | 'assigned' | 'driver_departed' | 'driver_arrived' |
             'pickup_confirmed' | 'started' | 'completed' | 'cancelled' |
             'anomaly_detected' | 'document_scanned';

  timestamp: Timestamp;

  // Context
  userId: string;              // Who triggered the event
  userRole: 'client' | 'driver' | 'system' | 'admin';

  // Location
  location?: GeoPoint;

  // Details
  details: {
    [key: string]: any;        // Flexible event-specific data
  };

  // Anomaly (if applicable)
  anomaly?: {
    type: 'deviation' | 'suspicious_stop' | 'delay' | 'route_change';
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoDetected: boolean;
    resolved: boolean;
  };

  // Integrity
  previousLogHash?: string;    // Chain logs together
  logHash: string;             // Hash of this log entry
}
```

---

### 7️⃣ **corporateAccounts** (Root Collection)
**Purpose:** Corporate/institutional clients

```typescript
/corporateAccounts/{corporateId}
{
  corporateId: string;
  accountCode: string;         // "CORP-LAW-WIEN-01"

  // Organization
  organizationName: string;
  organizationType: 'law_firm' | 'hospital' | 'embassy' | 'government' | 'enterprise';

  // Contact
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };

  // Billing
  billingType: 'monthly' | 'per_mission' | 'prepaid';
  monthlyAllowance?: number;   // Missions per month
  billingEmail: string;
  paymentMethod: string;

  // Access
  authorizedUsers: string[];   // Array of userId
  maxSecurityLevel: 'standard' | 'discreet' | 'confidential' | 'critical';

  // Usage
  stats: {
    totalMissions: number;
    monthlyMissions: number;
    totalSpent: number;
    averageSecurityLevel: string;
  };

  // Status
  status: 'active' | 'suspended' | 'trial';
  createdAt: Timestamp;
  contractExpiresAt?: Timestamp;
}
```

---

### 8️⃣ **documentReports** (Root Collection)
**Purpose:** Legal-value PDF reports for document deliveries

```typescript
/documentReports/{reportId}
{
  reportId: string;
  missionId: string;

  // Mission Reference
  missionCode: string;
  documentType: string;
  securityLevel: string;

  // Chain of Custody
  chainOfCustody: Array<{
    event: string;
    timestamp: Timestamp;
    location: GeoPoint;
    performedBy: string;       // Anonymous code
    verified: boolean;
    signature?: string;        // Digital signature
  }>;

  // Scans
  pickupScan: string;          // Image URL
  deliveryScan: string;        // Image URL

  // Timing
  pickupTime: Timestamp;
  deliveryTime: Timestamp;
  totalDuration: number;       // minutes

  // Verification
  clientConfirmation: {
    method: string;
    timestamp: Timestamp;
    code: string;
  };

  recipientConfirmation: {
    method: string;
    timestamp: Timestamp;
    code: string;
  };

  // Report
  pdfUrl: string;              // Generated PDF URL
  reportHash: string;          // Immutable hash for legal proof
  generatedAt: Timestamp;

  // Legal
  legallyValid: boolean;
  validatedBy: string;         // System/admin
  validatedAt: Timestamp;
}
```

---

### 9️⃣ **notifications** (Root Collection)
**Purpose:** Multi-stage notification system

```typescript
/notifications/{notificationId}
{
  notificationId: string;
  userId: string;

  // Type
  type: 'mission_assigned' | 'driver_en_route' | 'driver_arrived' |
        'mission_started' | 'mission_completed' | 'anomaly_alert' |
        'payment_success' | 'document_delivered';

  // Content
  title: string;
  message: string;

  // Mission Context
  missionId?: string;
  missionCode?: string;

  // Status
  read: boolean;
  sentAt: Timestamp;
  readAt?: Timestamp;

  // Delivery
  channels: ['push', 'sms', 'email'];
  delivered: boolean;
}
```

---

## 🔒 FIREBASE SECURITY RULES PRINCIPLES

### Core Rules:

1. **Users can only read their own data**
2. **Drivers see missions with minimal info (no real names)**
3. **Admins have full access with audit logs**
4. **Mission data is compartmentalized by role**
5. **Logs are append-only (immutable)**

### Key Security Patterns:

```javascript
// Example: Mission access
match /missions/{missionId} {
  allow read: if request.auth.uid == resource.data.clientId
              || request.auth.uid == resource.data.driverId
              || isAdmin();

  allow write: if request.auth.uid == resource.data.clientId
               || isAdmin();
}

// Example: Driver sees limited data
function getDriverMissionView(mission) {
  return {
    missionCode: mission.missionCode,
    clientCode: mission.clientCode,  // NOT real name
    securityLevel: mission.securityLevel,
    pickup: mission.pickup,
    dropoff: mission.dropoff,
    type: mission.type
    // NO clientId, NO real identity
  };
}
```

---

## 📈 INDEXES REQUIRED

### Firestore Composite Indexes:

1. **missions**
   - `clientId` + `status` + `createdAt`
   - `driverId` + `status` + `createdAt`
   - `status` + `securityLevel` + `scheduledFor`

2. **missionLogs**
   - `missionId` + `timestamp`
   - `eventType` + `timestamp`

3. **driverProfiles**
   - `isOnline` + `maxSecurityLevel` + `stats.averageRating`
   - `certificationLevel` + `status`

4. **notifications**
   - `userId` + `read` + `sentAt`

---

## 🚀 NEXT STEPS

1. ✅ Implement anonymous code generation service
2. ✅ Create mission-based data structure
3. ✅ Update Firebase security rules
4. ✅ Build client/driver services with compartmentalized access
5. ✅ Implement document delivery workflow
6. ✅ Create PDF report generation
7. ✅ Build real-time tracking with anomaly detection

---

**This schema enables the complete ON TIME vision with Firebase/Firestore.**
