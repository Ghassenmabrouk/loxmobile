import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface QRCodeDisplayProps {
  code: string;
  missionCode?: string;
  title?: string;
  subtitle?: string;
  size?: number;
}

export default function QRCodeDisplay({
  code,
  missionCode,
  title = 'Confirmation Code',
  subtitle = 'Show this to your driver',
  size = 240,
}: QRCodeDisplayProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(79, 172, 254, 0.2)', 'rgba(79, 172, 254, 0.05)']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {missionCode && (
          <View style={styles.missionCodeContainer}>
            <Text style={styles.missionCodeLabel}>Mission</Text>
            <Text style={styles.missionCode}>{missionCode}</Text>
          </View>
        )}

        <View style={styles.qrContainer}>
          <View style={styles.qrBackground}>
            <QRCode
              value={code}
              size={size}
              backgroundColor="white"
              color="black"
              logo={require('@/assets/images/icon.png')}
              logoSize={40}
              logoBackgroundColor="white"
              logoMargin={4}
            />
          </View>
        </View>

        <View style={styles.codeTextContainer}>
          <Text style={styles.codeLabel}>Code</Text>
          <Text style={styles.codeText}>{code}</Text>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionIcon}>ℹ️</Text>
          <Text style={styles.instructionText}>
            The driver will scan this QR code to confirm mission completion
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0c0',
    marginBottom: 24,
    textAlign: 'center',
  },
  missionCodeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  missionCodeLabel: {
    fontSize: 11,
    color: '#a0a0c0',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  missionCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  qrContainer: {
    marginBottom: 24,
  },
  qrBackground: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  codeTextContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  codeLabel: {
    fontSize: 11,
    color: '#a0a0c0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 3,
  },
  instructionBox: {
    backgroundColor: 'rgba(79, 172, 254, 0.15)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.25)',
  },
  instructionIcon: {
    fontSize: 18,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
});
