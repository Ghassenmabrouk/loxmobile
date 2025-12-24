import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SecurityLevelConfig, SecurityLevel } from '../types/mission';

const DEFAULT_SECURITY_LEVELS: SecurityLevelConfig[] = [
  {
    levelId: 'standard',
    icon: '🟢',
    name: 'Standard',
    description: 'Premium VIP transport with professional service',
    priceMultiplier: 1.0,
    driverRequirements: {
      minimumRating: 4.0,
      certificationRequired: false,
      backgroundCheckLevel: 'basic',
      experienceMinimum: 10,
    },
    vehicleRequirements: {
      luxuryLevel: 'standard',
      tintedWindows: false,
      secureCompartment: false,
    },
    features: {
      enhancedLogging: false,
      dedicatedSupport: false,
      priorityAssignment: false,
      anomalyMonitoring: false,
      legalReport: false,
    },
    availableToPublic: true,
    requiresPreApproval: false,
  },
  {
    levelId: 'discreet',
    icon: '🔵',
    name: 'Discreet',
    description: 'Enhanced privacy for sensitive individuals (doctors, executives, celebrities)',
    priceMultiplier: 1.5,
    driverRequirements: {
      minimumRating: 4.5,
      certificationRequired: true,
      backgroundCheckLevel: 'enhanced',
      experienceMinimum: 50,
    },
    vehicleRequirements: {
      luxuryLevel: 'premium',
      tintedWindows: true,
      secureCompartment: false,
    },
    features: {
      enhancedLogging: true,
      dedicatedSupport: true,
      priorityAssignment: true,
      anomalyMonitoring: true,
      legalReport: false,
    },
    availableToPublic: true,
    requiresPreApproval: false,
  },
  {
    levelId: 'confidential',
    icon: '🟠',
    name: 'Confidential',
    description: 'Secure transport for sensitive documents (legal, medical, corporate)',
    priceMultiplier: 2.0,
    driverRequirements: {
      minimumRating: 4.7,
      certificationRequired: true,
      backgroundCheckLevel: 'criminal',
      experienceMinimum: 100,
    },
    vehicleRequirements: {
      luxuryLevel: 'premium',
      tintedWindows: true,
      secureCompartment: true,
    },
    features: {
      enhancedLogging: true,
      dedicatedSupport: true,
      priorityAssignment: true,
      anomalyMonitoring: true,
      legalReport: true,
    },
    availableToPublic: true,
    requiresPreApproval: true,
  },
  {
    levelId: 'critical',
    icon: '🔴',
    name: 'Critical',
    description: 'Maximum security for diplomatic, governmental, and hyper-sensitive missions',
    priceMultiplier: 3.0,
    driverRequirements: {
      minimumRating: 4.9,
      certificationRequired: true,
      backgroundCheckLevel: 'security_clearance',
      experienceMinimum: 200,
    },
    vehicleRequirements: {
      luxuryLevel: 'luxury',
      tintedWindows: true,
      secureCompartment: true,
    },
    features: {
      enhancedLogging: true,
      dedicatedSupport: true,
      priorityAssignment: true,
      anomalyMonitoring: true,
      legalReport: true,
    },
    availableToPublic: false,
    requiresPreApproval: true,
  },
];

export async function initializeSecurityLevels(): Promise<void> {
  for (const level of DEFAULT_SECURITY_LEVELS) {
    const levelRef = doc(db, 'securityLevels', level.levelId);
    const levelSnap = await getDoc(levelRef);

    if (!levelSnap.exists()) {
      await setDoc(levelRef, level);
      console.log(`Security level ${level.levelId} initialized`);
    }
  }
}

export async function getSecurityLevel(levelId: SecurityLevel): Promise<SecurityLevelConfig | null> {
  const levelRef = doc(db, 'securityLevels', levelId);
  const levelSnap = await getDoc(levelRef);

  if (!levelSnap.exists()) {
    return null;
  }

  return levelSnap.data() as SecurityLevelConfig;
}

export async function getAllSecurityLevels(): Promise<SecurityLevelConfig[]> {
  const snapshot = await getDocs(collection(db, 'securityLevels'));
  return snapshot.docs.map((doc) => doc.data() as SecurityLevelConfig);
}

export async function getAvailableSecurityLevels(
  isPublic: boolean = true
): Promise<SecurityLevelConfig[]> {
  const allLevels = await getAllSecurityLevels();

  if (isPublic) {
    return allLevels.filter((level) => level.availableToPublic);
  }

  return allLevels;
}

export async function canDriverHandleSecurityLevel(
  driverId: string,
  securityLevel: SecurityLevel
): Promise<boolean> {
  const driverProfileRef = doc(db, 'driverProfiles', driverId);
  const driverProfileSnap = await getDoc(driverProfileRef);

  if (!driverProfileSnap.exists()) {
    return false;
  }

  const driverProfile = driverProfileSnap.data();
  const levelConfig = await getSecurityLevel(securityLevel);

  if (!levelConfig) {
    return false;
  }

  const levelOrder = ['standard', 'discreet', 'confidential', 'critical'];
  const driverMaxLevel = levelOrder.indexOf(driverProfile.maxSecurityLevel);
  const requiredLevel = levelOrder.indexOf(securityLevel);

  if (requiredLevel > driverMaxLevel) {
    return false;
  }

  if (
    driverProfile.stats.averageRating < levelConfig.driverRequirements.minimumRating
  ) {
    return false;
  }

  if (
    driverProfile.stats.completedMissions < levelConfig.driverRequirements.experienceMinimum
  ) {
    return false;
  }

  if (
    levelConfig.driverRequirements.certificationRequired &&
    driverProfile.certificationLevel !== securityLevel
  ) {
    const levelOrder = ['standard', 'discreet', 'confidential', 'critical'];
    const driverCertLevel = levelOrder.indexOf(driverProfile.certificationLevel);
    const requiredCertLevel = levelOrder.indexOf(securityLevel);

    if (requiredCertLevel > driverCertLevel) {
      return false;
    }
  }

  return true;
}

export function getSecurityLevelDisplay(level: SecurityLevel): string {
  const displays = {
    standard: '🟢 Standard',
    discreet: '🔵 Discreet',
    confidential: '🟠 Confidential',
    critical: '🔴 Critical',
  };

  return displays[level];
}
