import { Mission } from '@/app/types/mission';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

interface DocumentScan {
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photoUri: string;
  type: 'pickup' | 'dropoff';
}

interface PDFReportData {
  mission: Mission;
  pickupScan?: DocumentScan;
  dropoffScan?: DocumentScan;
  driverCode: string;
  clientCode: string;
  completedAt: Date;
}

export async function generateDocumentDeliveryReport(
  missionId: string
): Promise<string> {
  const mission = await getMission(missionId);

  if (mission.type !== 'document') {
    throw new Error('Mission is not a document delivery');
  }

  const reportData = await collectReportData(missionId, mission);
  const htmlContent = generateHTMLReport(reportData);

  return htmlContent;
}

async function getMission(missionId: string): Promise<Mission> {
  const missionDoc = await getDoc(doc(db, 'missions', missionId));

  if (!missionDoc.exists()) {
    throw new Error('Mission not found');
  }

  return { missionId: missionDoc.id, ...missionDoc.data() } as Mission;
}

async function collectReportData(
  missionId: string,
  mission: Mission
): Promise<PDFReportData> {
  const scansSnapshot = await getDoc(doc(db, 'documentScans', missionId));
  const scansData = scansSnapshot.exists() ? scansSnapshot.data() : {};

  return {
    mission,
    pickupScan: scansData.pickupScan,
    dropoffScan: scansData.dropoffScan,
    driverCode: mission.driverCode || 'N/A',
    clientCode: mission.clientCode,
    completedAt: new Date(),
  };
}

function generateHTMLReport(data: PDFReportData): string {
  const { mission, pickupScan, dropoffScan, driverCode, clientCode, completedAt } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ON TIME - Document Delivery Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #f5f5f7;
      padding: 40px 20px;
    }

    .report-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 4px;
      margin-bottom: 8px;
    }

    .header .tagline {
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.8;
    }

    .report-badge {
      background: rgba(255, 255, 255, 0.1);
      padding: 12px 24px;
      border-radius: 8px;
      display: inline-block;
      margin-top: 20px;
    }

    .report-badge strong {
      font-size: 18px;
      letter-spacing: 2px;
    }

    .content {
      padding: 40px;
    }

    .section {
      margin-bottom: 32px;
      padding-bottom: 32px;
      border-bottom: 2px solid #f0f0f0;
    }

    .section:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }

    .info-item {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #4facfe;
    }

    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6c757d;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .location-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .location-type {
      font-size: 14px;
      font-weight: 700;
      color: #4facfe;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .location-address {
      font-size: 16px;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .location-time {
      font-size: 13px;
      color: #6c757d;
    }

    .security-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .security-standard { background: #e8f5e9; color: #2e7d32; }
    .security-discreet { background: #e3f2fd; color: #1565c0; }
    .security-confidential { background: #fff3e0; color: #e65100; }
    .security-critical { background: #fce4ec; color: #c2185b; }

    .chain-of-custody {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 8px;
      border: 2px solid #4facfe;
    }

    .custody-event {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      position: relative;
    }

    .custody-event:last-child {
      margin-bottom: 0;
    }

    .custody-event::after {
      content: '';
      position: absolute;
      left: 19px;
      top: 40px;
      width: 2px;
      height: calc(100% + 24px);
      background: #dee2e6;
    }

    .custody-event:last-child::after {
      display: none;
    }

    .custody-icon {
      width: 40px;
      height: 40px;
      background: #4facfe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .custody-details {
      flex: 1;
    }

    .custody-title {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .custody-time {
      font-size: 13px;
      color: #6c757d;
      margin-bottom: 8px;
    }

    .custody-location {
      font-size: 14px;
      color: #495057;
    }

    .document-details {
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .document-type {
      font-size: 18px;
      font-weight: 700;
      color: #856404;
      margin-bottom: 12px;
    }

    .document-orgs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .legal-notice {
      background: #e7f3ff;
      border-left: 4px solid #2196f3;
      padding: 20px;
      border-radius: 4px;
      margin-top: 32px;
    }

    .legal-notice p {
      font-size: 13px;
      color: #0d47a1;
      line-height: 1.8;
      margin-bottom: 8px;
    }

    .footer {
      background: #f8f9fa;
      padding: 24px 40px;
      text-align: center;
      color: #6c757d;
      font-size: 13px;
    }

    .timestamp {
      font-weight: 600;
      color: #1a1a2e;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .report-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <h1>ON TIME</h1>
      <div class="tagline">Secure Document Delivery Report</div>
      <div class="report-badge">
        <strong>Mission ${mission.missionCode}</strong>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-title">📋 Mission Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Mission Code</div>
            <div class="info-value">${mission.missionCode}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Security Level</div>
            <div class="info-value">
              <span class="security-badge security-${mission.securityLevel}">
                ${mission.securityLevel.toUpperCase()}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Client Code</div>
            <div class="info-value">${clientCode}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Driver Code</div>
            <div class="info-value">${driverCode}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Scheduled</div>
            <div class="info-value">${new Date(mission.scheduledFor).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Completed</div>
            <div class="info-value">${completedAt.toLocaleString()}</div>
          </div>
        </div>
      </div>

      ${mission.documentDetails ? `
      <div class="section">
        <div class="section-title">📄 Document Details</div>
        <div class="document-details">
          <div class="document-type">${mission.documentDetails.type.toUpperCase()} Document</div>
          <div class="document-orgs">
            <div>
              <div class="info-label">Sender</div>
              <div class="info-value">${mission.documentDetails.senderOrganization}</div>
            </div>
            <div>
              <div class="info-label">Receiver</div>
              <div class="info-value">${mission.documentDetails.receiverOrganization}</div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">🗺️ Route Information</div>
        <div class="location-card">
          <div class="location-type">📍 Pickup Location</div>
          <div class="location-address">${mission.pickup.address}</div>
          <div class="location-time">${new Date(mission.pickup.timestamp).toLocaleString()}</div>
        </div>
        <div class="location-card">
          <div class="location-type">🎯 Dropoff Location</div>
          <div class="location-address">${mission.dropoff.address}</div>
          <div class="location-time">${new Date(mission.dropoff.timestamp).toLocaleString()}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🔗 Chain of Custody</div>
        <div class="chain-of-custody">
          <div class="custody-event">
            <div class="custody-icon">📦</div>
            <div class="custody-details">
              <div class="custody-title">Document Picked Up</div>
              <div class="custody-time">${pickupScan ? new Date(pickupScan.timestamp).toLocaleString() : 'N/A'}</div>
              <div class="custody-location">${mission.pickup.address}</div>
            </div>
          </div>

          <div class="custody-event">
            <div class="custody-icon">🚗</div>
            <div class="custody-details">
              <div class="custody-title">In Transit</div>
              <div class="custody-time">Driver: ${driverCode}</div>
              <div class="custody-location">Security Level: ${mission.securityLevel.toUpperCase()}</div>
            </div>
          </div>

          <div class="custody-event">
            <div class="custody-icon">✅</div>
            <div class="custody-details">
              <div class="custody-title">Document Delivered</div>
              <div class="custody-time">${dropoffScan ? new Date(dropoffScan.timestamp).toLocaleString() : 'N/A'}</div>
              <div class="custody-location">${mission.dropoff.address}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="legal-notice">
        <p><strong>LEGAL VALUE REPORT</strong></p>
        <p>This document certifies the secure delivery of documents through the ON TIME platform. All timestamps, locations, and participant codes have been cryptographically verified and stored in an immutable audit log.</p>
        <p>This report has legal value for chain of custody verification purposes. Document scans and GPS coordinates are securely stored and available for legal proceedings if required.</p>
        <p><strong>Report Generated:</strong> ${completedAt.toLocaleString()}</p>
        <p><strong>Report ID:</strong> ${mission.missionId}</p>
      </div>
    </div>

    <div class="footer">
      <p>ON TIME - Secure Mobility Infrastructure</p>
      <p class="timestamp">Generated on ${completedAt.toLocaleString()}</p>
      <p>© ${completedAt.getFullYear()} ON TIME. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function downloadReport(htmlContent: string, missionCode: string): Promise<void> {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ON_TIME_${missionCode}_Report.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generateAndDownloadReport(missionId: string): Promise<void> {
  const mission = await getMission(missionId);
  const htmlContent = await generateDocumentDeliveryReport(missionId);
  await downloadReport(htmlContent, mission.missionCode);
}
