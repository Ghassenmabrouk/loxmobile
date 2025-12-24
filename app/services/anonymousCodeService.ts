import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const PREFIXES = {
  client: 'OT',
  driver: 'DR',
  mission: 'M',
  corporate: 'CORP',
};

function generateRandomCode(length: number = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function isCodeUnique(
  collectionName: string,
  fieldName: string,
  code: string
): Promise<boolean> {
  const q = query(
    collection(db, collectionName),
    where(fieldName, '==', code)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

export async function generateAnonymousCode(
  type: 'client' | 'driver' | 'mission' | 'corporate',
  additionalPrefix?: string
): Promise<string> {
  const prefix = PREFIXES[type];
  const collectionName =
    type === 'mission' ? 'missions' : type === 'driver' ? 'driverProfiles' : 'users';
  const fieldName =
    type === 'mission' ? 'missionCode' : type === 'driver' ? 'driverCode' : 'anonymousCode';

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const randomPart = generateRandomCode(5);
    const code = additionalPrefix
      ? `${prefix}-${additionalPrefix}-${randomPart}`
      : `${prefix}-${randomPart}`;

    const isUnique = await isCodeUnique(collectionName, fieldName, code);

    if (isUnique) {
      return code;
    }

    attempts++;
  }

  throw new Error(`Failed to generate unique code for ${type} after ${maxAttempts} attempts`);
}

export function generateConfirmationCode(): string {
  return generateRandomCode(6);
}

export function generatePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskRealName(name: string): string {
  if (!name || name.length === 0) return '***';

  const parts = name.split(' ');
  if (parts.length === 1) {
    return name.charAt(0) + '***';
  }

  return parts.map((part, index) => {
    if (index === 0) {
      return part;
    }
    return part.charAt(0) + '***';
  }).join(' ');
}

export function generateQRCode(data: string): string {
  return `QR-${Buffer.from(data).toString('base64')}`;
}

export function validateConfirmationCode(input: string, stored: string): boolean {
  return input.toUpperCase() === stored.toUpperCase();
}
