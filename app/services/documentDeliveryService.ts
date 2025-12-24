import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  Timestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from './firebase';
import { DocumentDetails, DocumentType } from '../types/mission';

export interface DocumentScanData {
  imageUri: string;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  scannedBy: string;
}

export async function createDocumentMission(params: {
  clientId: string;
  clientCode: string;
  securityLevel: string;
  pickup: any;
  dropoff: any;
  scheduledFor: Date;
  documentType: DocumentType;
  sealedPackage: boolean;
  recipientName?: string;
  recipientCode?: string;
}): Promise<string> {
  const { createMission } = await import('./missionService');
  const { calculatePrice } = await import('./missionService');

  const distance = calculateDistance(
    params.pickup.coordinates.latitude,
    params.pickup.coordinates.longitude,
    params.dropoff.coordinates.latitude,
    params.dropoff.coordinates.longitude
  );

  const estimatedDuration = Math.ceil(distance / 0.5);

  const pricing = await calculatePrice(
    distance,
    estimatedDuration,
    params.securityLevel as any
  );

  const documentDetails: DocumentDetails = {
    documentType: params.documentType,
    sealedPackage: params.sealedPackage,
    recipientName: params.recipientName,
    recipientCode: params.recipientCode,
  };

  const mission = await createMission({
    clientId: params.clientId,
    clientCode: params.clientCode,
    type: 'document',
    securityLevel: params.securityLevel as any,
    pickup: params.pickup,
    dropoff: params.dropoff,
    scheduledFor: params.scheduledFor,
    estimatedDuration,
    basePrice: pricing.basePrice,
    securityPremium: pricing.securityPremium,
    documentDetails,
  });

  return mission.missionId;
}

export async function scanDocumentAtPickup(
  missionId: string,
  scanData: DocumentScanData
): Promise<void> {
  const missionRef = doc(db, 'missions', missionId);
  const missionSnap = await getDoc(missionRef);

  if (!missionSnap.exists()) {
    throw new Error('Mission not found');
  }

  const mission = missionSnap.data();

  if (mission.type !== 'document') {
    throw new Error('This is not a document mission');
  }

  await updateDoc(missionRef, {
    'documentDetails.scanAtPickup': scanData.imageUri,
    updatedAt: Timestamp.now(),
  });

  const logData = {
    missionId,
    eventType: 'document_scanned',
    timestamp: Timestamp.now(),
    userId: scanData.scannedBy,
    userRole: 'driver',
    location: new GeoPoint(scanData.location.latitude, scanData.location.longitude),
    details: {
      scanType: 'pickup',
      timestamp: scanData.timestamp.toISOString(),
    },
    logHash: generateHash({ missionId, scanType: 'pickup' }),
  };

  await addDoc(collection(db, 'missionLogs'), logData);
}

export async function scanDocumentAtDelivery(
  missionId: string,
  scanData: DocumentScanData
): Promise<void> {
  const missionRef = doc(db, 'missions', missionId);
  const missionSnap = await getDoc(missionRef);

  if (!missionSnap.exists()) {
    throw new Error('Mission not found');
  }

  const mission = missionSnap.data();

  if (mission.type !== 'document') {
    throw new Error('This is not a document mission');
  }

  await updateDoc(missionRef, {
    'documentDetails.scanAtDelivery': scanData.imageUri,
    updatedAt: Timestamp.now(),
  });

  const logData = {
    missionId,
    eventType: 'document_scanned',
    timestamp: Timestamp.now(),
    userId: scanData.scannedBy,
    userRole: 'driver',
    location: new GeoPoint(scanData.location.latitude, scanData.location.longitude),
    details: {
      scanType: 'delivery',
      timestamp: scanData.timestamp.toISOString(),
    },
    logHash: generateHash({ missionId, scanType: 'delivery' }),
  };

  await addDoc(collection(db, 'missionLogs'), logData);

  await generateDocumentReport(missionId);
}

export async function generateDocumentReport(missionId: string): Promise<string> {
  const missionRef = doc(db, 'missions', missionId);
  const missionSnap = await getDoc(missionRef);

  if (!missionSnap.exists()) {
    throw new Error('Mission not found');
  }

  const mission = missionSnap.data();

  if (mission.type !== 'document') {
    throw new Error('This is not a document mission');
  }

  const chainOfCustody = await buildChainOfCustody(missionId);

  const reportData = {
    missionId,
    missionCode: mission.missionCode,
    documentType: mission.documentDetails.documentType,
    securityLevel: mission.securityLevel,
    chainOfCustody,
    pickupScan: mission.documentDetails.scanAtPickup || null,
    deliveryScan: mission.documentDetails.scanAtDelivery || null,
    pickupTime: mission.missionStartedAt,
    deliveryTime: mission.missionCompletedAt,
    totalDuration: mission.actualDuration,
    clientConfirmation: {
      method: mission.confirmationMethod,
      timestamp: mission.confirmedAt,
      code: mission.confirmationCode,
    },
    recipientConfirmation: {
      method: mission.confirmationMethod,
      timestamp: mission.missionCompletedAt,
      code: mission.confirmationCode,
    },
    pdfUrl: '',
    reportHash: generateReportHash(mission),
    generatedAt: Timestamp.now(),
    legallyValid: true,
    validatedBy: 'system',
    validatedAt: Timestamp.now(),
  };

  const reportRef = await addDoc(collection(db, 'documentReports'), reportData);

  return reportRef.id;
}

async function buildChainOfCustody(missionId: string): Promise<any[]> {
  const logsRef = collection(db, 'missionLogs');
  const { query, where, orderBy, getDocs } = await import('firebase/firestore');

  const q = query(
    logsRef,
    where('missionId', '==', missionId),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      event: data.eventType,
      timestamp: data.timestamp,
      location: data.location,
      performedBy: data.userId,
      verified: true,
      signature: data.logHash,
    };
  });
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateHash(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function generateReportHash(mission: any): string {
  const data = {
    missionId: mission.missionId,
    missionCode: mission.missionCode,
    clientCode: mission.clientCode,
    driverCode: mission.driverCode,
    pickupTime: mission.missionStartedAt,
    deliveryTime: mission.missionCompletedAt,
  };
  return generateHash(data);
}

export async function getDocumentReport(reportId: string) {
  const reportRef = doc(db, 'documentReports', reportId);
  const reportSnap = await getDoc(reportRef);

  if (!reportSnap.exists()) {
    throw new Error('Report not found');
  }

  return reportSnap.data();
}

export async function getMissionDocumentReport(missionId: string) {
  const { query, where, getDocs } = await import('firebase/firestore');

  const q = query(
    collection(db, 'documentReports'),
    where('missionId', '==', missionId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return {
    reportId: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  };
}
