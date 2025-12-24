import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from './firebase';
import { Mission, MissionType, SecurityLevel, Location } from '../types/mission';
import { generateAnonymousCode, generateConfirmationCode } from './anonymousCodeService';

export async function createMission(params: {
  clientId: string;
  clientCode: string;
  type: MissionType;
  securityLevel: SecurityLevel;
  pickup: Location;
  dropoff: Location;
  scheduledFor: Date;
  estimatedDuration: number;
  basePrice: number;
  securityPremium: number;
  documentDetails?: any;
}): Promise<Mission> {
  const missionCode = await generateAnonymousCode('mission');
  const confirmationCode = generateConfirmationCode();

  const missionData = {
    missionCode,
    type: params.type,
    securityLevel: params.securityLevel,
    clientId: params.clientId,
    clientCode: params.clientCode,
    pickup: {
      address: params.pickup.address,
      coordinates: new GeoPoint(
        params.pickup.coordinates.latitude,
        params.pickup.coordinates.longitude
      ),
      timestamp: Timestamp.fromDate(params.pickup.timestamp),
    },
    dropoff: {
      address: params.dropoff.address,
      coordinates: new GeoPoint(
        params.dropoff.coordinates.latitude,
        params.dropoff.coordinates.longitude
      ),
      timestamp: Timestamp.fromDate(params.dropoff.timestamp),
    },
    requestedAt: Timestamp.now(),
    scheduledFor: Timestamp.fromDate(params.scheduledFor),
    estimatedDuration: params.estimatedDuration,
    status: 'pending',
    basePrice: params.basePrice,
    securityPremium: params.securityPremium,
    totalPrice: params.basePrice + params.securityPremium,
    currency: 'EUR',
    confirmationMethod: 'qr',
    confirmationCode,
    documentDetails: params.documentDetails || null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'missions'), missionData);

  await logMissionEvent({
    missionId: docRef.id,
    eventType: 'created',
    userId: params.clientId,
    userRole: 'client',
    details: {
      type: params.type,
      securityLevel: params.securityLevel,
      scheduledFor: params.scheduledFor.toISOString(),
    },
  });

  const mission = {
    missionId: docRef.id,
    ...missionData,
    requestedAt: missionData.requestedAt.toDate(),
    scheduledFor: missionData.scheduledFor.toDate(),
    pickup: {
      ...params.pickup,
    },
    dropoff: {
      ...params.dropoff,
    },
    createdAt: missionData.createdAt.toDate(),
    updatedAt: missionData.updatedAt.toDate(),
  } as Mission;

  return mission;
}

export async function assignMissionToDriver(
  missionId: string,
  driverId: string,
  driverCode: string
): Promise<void> {
  const missionRef = doc(db, 'missions', missionId);

  await updateDoc(missionRef, {
    driverId,
    driverCode,
    status: 'assigned',
    updatedAt: Timestamp.now(),
  });

  await logMissionEvent({
    missionId,
    eventType: 'assigned',
    userId: driverId,
    userRole: 'driver',
    details: {
      driverCode,
    },
  });
}

export async function updateMissionStatus(
  missionId: string,
  status: Mission['status'],
  userId: string,
  userRole: 'client' | 'driver' | 'system',
  additionalData?: Partial<Mission>
): Promise<void> {
  const missionRef = doc(db, 'missions', missionId);

  const updateData: any = {
    status,
    updatedAt: Timestamp.now(),
    ...additionalData,
  };

  if (status === 'driver_en_route' && !additionalData?.driverDepartedAt) {
    updateData.driverDepartedAt = Timestamp.now();
  } else if (status === 'driver_arrived' && !additionalData?.driverArrivedAt) {
    updateData.driverArrivedAt = Timestamp.now();
  } else if (status === 'in_progress' && !additionalData?.missionStartedAt) {
    updateData.missionStartedAt = Timestamp.now();
  } else if (status === 'completed' && !additionalData?.missionCompletedAt) {
    updateData.missionCompletedAt = Timestamp.now();
  }

  await updateDoc(missionRef, updateData);

  const eventTypeMap: Record<string, any> = {
    driver_en_route: 'driver_departed',
    driver_arrived: 'driver_arrived',
    in_progress: 'started',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  await logMissionEvent({
    missionId,
    eventType: eventTypeMap[status] || status,
    userId,
    userRole,
    details: additionalData || {},
  });
}

export async function getMission(missionId: string): Promise<Mission | null> {
  const missionRef = doc(db, 'missions', missionId);
  const missionSnap = await getDoc(missionRef);

  if (!missionSnap.exists()) {
    return null;
  }

  const data = missionSnap.data();
  return {
    missionId: missionSnap.id,
    ...data,
    requestedAt: data.requestedAt.toDate(),
    scheduledFor: data.scheduledFor.toDate(),
    pickup: {
      address: data.pickup.address,
      coordinates: {
        latitude: data.pickup.coordinates.latitude,
        longitude: data.pickup.coordinates.longitude,
      },
      timestamp: data.pickup.timestamp.toDate(),
    },
    dropoff: {
      address: data.dropoff.address,
      coordinates: {
        latitude: data.dropoff.coordinates.latitude,
        longitude: data.dropoff.coordinates.longitude,
      },
      timestamp: data.dropoff.timestamp.toDate(),
    },
    driverDepartedAt: data.driverDepartedAt?.toDate(),
    driverArrivedAt: data.driverArrivedAt?.toDate(),
    missionStartedAt: data.missionStartedAt?.toDate(),
    missionCompletedAt: data.missionCompletedAt?.toDate(),
    confirmedAt: data.confirmedAt?.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Mission;
}

export async function getClientMissions(clientId: string): Promise<Mission[]> {
  const q = query(
    collection(db, 'missions'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      missionId: doc.id,
      ...data,
      requestedAt: data.requestedAt.toDate(),
      scheduledFor: data.scheduledFor.toDate(),
      pickup: {
        address: data.pickup.address,
        coordinates: {
          latitude: data.pickup.coordinates.latitude,
          longitude: data.pickup.coordinates.longitude,
        },
        timestamp: data.pickup.timestamp.toDate(),
      },
      dropoff: {
        address: data.dropoff.address,
        coordinates: {
          latitude: data.dropoff.coordinates.latitude,
          longitude: data.dropoff.coordinates.longitude,
        },
        timestamp: data.dropoff.timestamp.toDate(),
      },
      driverDepartedAt: data.driverDepartedAt?.toDate(),
      driverArrivedAt: data.driverArrivedAt?.toDate(),
      missionStartedAt: data.missionStartedAt?.toDate(),
      missionCompletedAt: data.missionCompletedAt?.toDate(),
      confirmedAt: data.confirmedAt?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Mission;
  });
}

export async function getDriverMissions(driverId: string): Promise<Mission[]> {
  const q = query(
    collection(db, 'missions'),
    where('driverId', '==', driverId),
    orderBy('scheduledFor', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      missionId: doc.id,
      ...data,
      requestedAt: data.requestedAt.toDate(),
      scheduledFor: data.scheduledFor.toDate(),
      pickup: {
        address: data.pickup.address,
        coordinates: {
          latitude: data.pickup.coordinates.latitude,
          longitude: data.pickup.coordinates.longitude,
        },
        timestamp: data.pickup.timestamp.toDate(),
      },
      dropoff: {
        address: data.dropoff.address,
        coordinates: {
          latitude: data.dropoff.coordinates.latitude,
          longitude: data.dropoff.coordinates.longitude,
        },
        timestamp: data.dropoff.timestamp.toDate(),
      },
      driverDepartedAt: data.driverDepartedAt?.toDate(),
      driverArrivedAt: data.driverArrivedAt?.toDate(),
      missionStartedAt: data.missionStartedAt?.toDate(),
      missionCompletedAt: data.missionCompletedAt?.toDate(),
      confirmedAt: data.confirmedAt?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Mission;
  });
}

export async function getDriverMissionView(missionId: string, driverId: string) {
  const mission = await getMission(missionId);

  if (!mission || mission.driverId !== driverId) {
    throw new Error('Mission not found or unauthorized');
  }

  return {
    missionId: mission.missionId,
    missionCode: mission.missionCode,
    clientCode: mission.clientCode,
    type: mission.type,
    securityLevel: mission.securityLevel,
    pickup: mission.pickup,
    dropoff: mission.dropoff,
    scheduledFor: mission.scheduledFor,
    status: mission.status,
    confirmationMethod: mission.confirmationMethod,
    confirmationCode: mission.confirmationCode,
    estimatedDuration: mission.estimatedDuration,
  };
}

async function logMissionEvent(params: {
  missionId: string;
  eventType: string;
  userId: string;
  userRole: 'client' | 'driver' | 'system' | 'admin';
  location?: { latitude: number; longitude: number };
  details: Record<string, any>;
  anomaly?: any;
}) {
  const logData = {
    missionId: params.missionId,
    eventType: params.eventType,
    timestamp: Timestamp.now(),
    userId: params.userId,
    userRole: params.userRole,
    location: params.location
      ? new GeoPoint(params.location.latitude, params.location.longitude)
      : null,
    details: params.details,
    anomaly: params.anomaly || null,
    logHash: generateLogHash(params),
  };

  await addDoc(collection(db, 'missionLogs'), logData);
}

function generateLogHash(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export async function calculatePrice(
  distance: number,
  duration: number,
  securityLevel: SecurityLevel
): Promise<{ basePrice: number; securityPremium: number; totalPrice: number }> {
  const basePricePerKm = 2.5;
  const basePricePerMinute = 0.5;
  const minimumPrice = 15;

  const distancePrice = distance * basePricePerKm;
  const durationPrice = duration * basePricePerMinute;
  let basePrice = Math.max(distancePrice + durationPrice, minimumPrice);

  const securityMultipliers = {
    standard: 1.0,
    discreet: 1.5,
    confidential: 2.0,
    critical: 3.0,
  };

  const multiplier = securityMultipliers[securityLevel];
  const securityPremium = basePrice * (multiplier - 1);
  const totalPrice = basePrice + securityPremium;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    securityPremium: Math.round(securityPremium * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}
