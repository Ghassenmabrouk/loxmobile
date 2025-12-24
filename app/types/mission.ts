export type SecurityLevel = 'standard' | 'discreet' | 'confidential' | 'critical';
export type MissionType = 'person' | 'document';
export type MissionStatus =
  | 'pending'
  | 'assigned'
  | 'driver_en_route'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type DocumentType = 'legal' | 'medical' | 'diplomatic' | 'corporate' | 'confidential';
export type ConfirmationMethod = 'qr' | 'nfc' | 'pin' | 'visual';

export interface Location {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
}

export interface DocumentDetails {
  documentType: DocumentType;
  sealedPackage: boolean;
  scanAtPickup?: string;
  scanAtDelivery?: string;
  recipientName?: string;
  recipientCode?: string;
}

export interface Mission {
  missionId: string;
  missionCode: string;
  type: MissionType;
  securityLevel: SecurityLevel;
  clientId: string;
  clientCode: string;
  driverId?: string;
  driverCode?: string;
  pickup: Location;
  dropoff: Location;
  requestedAt: Date;
  scheduledFor: Date;
  driverDepartedAt?: Date;
  driverArrivedAt?: Date;
  missionStartedAt?: Date;
  missionCompletedAt?: Date;
  estimatedDuration: number;
  actualDuration?: number;
  status: MissionStatus;
  basePrice: number;
  securityPremium: number;
  totalPrice: number;
  currency: string;
  confirmationMethod: ConfirmationMethod;
  confirmationCode: string;
  confirmedAt?: Date;
  documentDetails?: DocumentDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface MissionTracking {
  missionId: string;
  driverId: string;
  currentLocation: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    heading: number;
    speed: number;
    accuracy: number;
    timestamp: Date;
  };
  estimatedArrival: Date;
  distanceRemaining: number;
  timeRemaining: number;
  plannedRoute: Array<{ latitude: number; longitude: number }>;
  actualRoute: Array<{ latitude: number; longitude: number }>;
  deviations: Array<{
    timestamp: Date;
    deviation: number;
    reason?: string;
  }>;
  suspiciousStops: Array<{
    timestamp: Date;
    duration: number;
    location: { latitude: number; longitude: number };
    flagged: boolean;
  }>;
  isActive: boolean;
  lastUpdateAt: Date;
}

export interface SecurityLevelConfig {
  levelId: SecurityLevel;
  icon: string;
  name: string;
  description: string;
  priceMultiplier: number;
  driverRequirements: {
    minimumRating: number;
    certificationRequired: boolean;
    backgroundCheckLevel: 'basic' | 'enhanced' | 'criminal' | 'security_clearance';
    experienceMinimum: number;
  };
  vehicleRequirements: {
    luxuryLevel: 'standard' | 'premium' | 'luxury';
    tintedWindows: boolean;
    secureCompartment: boolean;
  };
  features: {
    enhancedLogging: boolean;
    dedicatedSupport: boolean;
    priorityAssignment: boolean;
    anomalyMonitoring: boolean;
    legalReport: boolean;
  };
  availableToPublic: boolean;
  requiresPreApproval: boolean;
}

export interface MissionLog {
  logId: string;
  missionId: string;
  eventType:
    | 'created'
    | 'assigned'
    | 'driver_departed'
    | 'driver_arrived'
    | 'pickup_confirmed'
    | 'started'
    | 'completed'
    | 'cancelled'
    | 'anomaly_detected'
    | 'document_scanned';
  timestamp: Date;
  userId: string;
  userRole: 'client' | 'driver' | 'system';
  location?: { latitude: number; longitude: number };
  details: Record<string, any>;
  anomaly?: {
    type: 'deviation' | 'suspicious_stop' | 'delay' | 'route_change';
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoDetected: boolean;
    resolved: boolean;
  };
  previousLogHash?: string;
  logHash: string;
}
