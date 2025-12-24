import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { getMission, updateMissionStatus, getDriverMissionView } from '@/app/services/missionService';
import { Mission } from '@/app/types/mission';

export default function DriverMissionViewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const missionId = params.missionId as string;

  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissionData();
  }, [missionId]);

  async function loadMissionData() {
    if (!user || !missionId) return;

    try {
      setLoading(true);
      const missionData = await getDriverMissionView(missionId, user.uid);
      setMission(missionData);
    } catch (error) {
      console.error('Error loading mission:', error);
      Alert.alert('Error', 'Failed to load mission details');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(newStatus: Mission['status']) {
    if (!user || !missionId) return;

    try {
      await updateMissionStatus(missionId, newStatus, user.uid, 'driver');
      await loadMissionData();
      Alert.alert('Success', `Mission status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update mission status');
    }
  }

  function renderStatusActions() {
    if (!mission) return null;

    const actions: Record<string, { next: Mission['status']; label: string; icon: string; color: string[] }> = {
      assigned: {
        next: 'driver_en_route',
        label: 'Start Driving to Pickup',
        icon: '🚗',
        color: ['#4facfe', '#00f2fe'],
      },
      driver_en_route: {
        next: 'driver_arrived',
        label: 'Arrived at Pickup',
        icon: '📍',
        color: ['#43e97b', '#38f9d7'],
      },
      driver_arrived: {
        next: 'in_progress',
        label: 'Start Mission',
        icon: '▶️',
        color: ['#fa709a', '#fee140'],
      },
      in_progress: {
        next: 'completed',
        label: 'Complete Mission',
        icon: '✅',
        color: ['#30cfd0', '#330867'],
      },
    };

    const action = actions[mission.status];
    if (!action) return null;

    return (
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          Alert.alert(
            'Confirm Action',
            `Update status to ${action.label}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm',
                onPress: () => handleStatusUpdate(action.next),
              },
            ]
          );
        }}
      >
        <LinearGradient
          colors={action.color}
          style={styles.actionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.actionIcon}>{action.icon}</Text>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  function getSecurityLevelDisplay(level: string) {
    const displays: Record<string, { icon: string; color: string }> = {
      standard: { icon: '🟢', color: '#11998e' },
      discreet: { icon: '🔵', color: '#4facfe' },
      confidential: { icon: '🟠', color: '#fa709a' },
      critical: { icon: '🔴', color: '#f093fb' },
    };
    return displays[level] || displays.standard;
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading mission...</Text>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.gradient}>
          <Text style={styles.emptyTitle}>Mission Not Found</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const securityDisplay = getSecurityLevelDisplay(mission.securityLevel);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mission</Text>
            <Text style={styles.headerSubtitle}>{mission.missionCode}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.clientCard}>
            <Text style={styles.clientLabel}>Client Code</Text>
            <Text style={styles.clientCode}>{mission.clientCode}</Text>
            <Text style={styles.clientNote}>Anonymous for privacy</Text>
          </View>

          <View style={styles.securityCard}>
            <Text style={styles.securityIcon}>{securityDisplay.icon}</Text>
            <Text style={styles.securityLevel}>{mission.securityLevel.toUpperCase()}</Text>
            <Text style={styles.securitySubtitle}>Security Level</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Mission Type</Text>
            <View style={styles.typeCard}>
              <Text style={styles.typeIcon}>
                {mission.type === 'person' ? '🚗' : '📄'}
              </Text>
              <Text style={styles.typeLabel}>
                {mission.type === 'person' ? 'Person Transport' : 'Document Delivery'}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Route</Text>

            <View style={styles.locationCard}>
              <View style={styles.locationItem}>
                <View style={styles.locationIconContainer}>
                  <Text style={styles.locationIcon}>📍</Text>
                </View>
                <View style={styles.locationContent}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>
                    {mission.pickup.address}
                  </Text>
                  <Text style={styles.locationTime}>
                    {new Date(mission.scheduledFor).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.locationDivider}>
                <View style={styles.locationLine} />
                <Text style={styles.locationArrow}>↓</Text>
              </View>

              <View style={styles.locationItem}>
                <View style={styles.locationIconContainer}>
                  <Text style={styles.locationIcon}>🎯</Text>
                </View>
                <View style={styles.locationContent}>
                  <Text style={styles.locationLabel}>Dropoff</Text>
                  <Text style={styles.locationAddress}>
                    {mission.dropoff.address}
                  </Text>
                  <Text style={styles.locationTime}>
                    Est. {mission.estimatedDuration} minutes
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {mission.confirmationCode && (
            <View style={styles.confirmationSection}>
              <Text style={styles.sectionTitle}>Confirmation</Text>
              <View style={styles.confirmationCard}>
                <Text style={styles.confirmationMethod}>
                  {mission.confirmationMethod === 'qr' ? '📱 QR Code' : '🔢 PIN'}
                </Text>
                <Text style={styles.confirmationCode}>{mission.confirmationCode}</Text>
                <Text style={styles.confirmationNote}>
                  Client will use this to confirm mission
                </Text>
              </View>
            </View>
          )}

          {renderStatusActions()}

          {mission.type === 'document' && (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Document delivery requires scanning at pickup and dropoff. Legal-value report will be generated.
              </Text>
            </View>
          )}

          {mission.securityLevel === 'confidential' || mission.securityLevel === 'critical' ? (
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>🔐</Text>
              <Text style={styles.warningText}>
                High security level: Enhanced logging active. Maintain maximum discretion.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0c0',
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#a0a0c0',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#4facfe',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  clientCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clientLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientCode: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  clientNote: {
    fontSize: 12,
    color: '#a0a0c0',
  },
  securityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  securityLevel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  securitySubtitle: {
    fontSize: 12,
    color: '#a0a0c0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 1,
  },
  typeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeIcon: {
    fontSize: 32,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationAddress: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 4,
  },
  locationTime: {
    fontSize: 13,
    color: '#4facfe',
  },
  locationDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingVertical: 12,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationArrow: {
    fontSize: 16,
    color: '#a0a0c0',
    marginLeft: 8,
  },
  confirmationSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  confirmationCard: {
    backgroundColor: 'rgba(79, 172, 254, 0.2)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
  },
  confirmationMethod: {
    fontSize: 14,
    color: '#a0a0c0',
    marginBottom: 12,
  },
  confirmationCode: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 12,
  },
  confirmationNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actionButton: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionGradient: {
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  warningCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
});
