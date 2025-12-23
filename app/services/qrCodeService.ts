export interface QRCodeData {
  transferId: string;
  verificationCode: string;
  userId: string;
  timestamp: number;
}

export const qrCodeService = {
  generateQRData(transferId: string, verificationCode: string, userId: string): string {
    const data: QRCodeData = {
      transferId,
      verificationCode,
      userId,
      timestamp: Date.now()
    };
    return JSON.stringify(data);
  },

  parseQRData(qrData: string): QRCodeData | null {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.transferId && parsed.verificationCode && parsed.userId && parsed.timestamp) {
        return parsed as QRCodeData;
      }
      return null;
    } catch (error) {
      console.error('Failed to parse QR data:', error);
      return null;
    }
  },

  isQRDataValid(qrData: QRCodeData, maxAgeMinutes: number = 60): boolean {
    const now = Date.now();
    const age = now - qrData.timestamp;
    const maxAge = maxAgeMinutes * 60 * 1000;
    return age <= maxAge;
  }
};
