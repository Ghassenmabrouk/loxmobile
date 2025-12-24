import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { getMission, getClientMissions } from '@/app/services/missionService';
import { Mission } from '@/app/types/mission';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/app/services/firebase';
import { authService } from '@/app/services/authService';

export default function MissionTrackingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const missionId = params.missionId as string;

  const [mission, setMission] = useState<Mission | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMissionId, setSelectedMissionId] = useState<string>(missionId || '');

  useEffect(() => {
    if (user) {
      initializeUserAndLoadMissions();
    }
  }, [user]);

  async function initializeUserAndLoadMissions() {
    if (!user) return;

    try {
      await authService.migrateUserDocument(user.uid);
      await loadMissions();
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  useEffect(() => {
    if (selectedMissionId) {
      loadMissionData();
      const unsubscribe = subscribeToMissionUpdates();
      return () => unsubscribe && unsubscribe();
    }
  }, [selectedMissionId]);

  async function loadMissions() {
    if (!user) return;

    try {
      const userMissions = await getClientMissions(user.uid);
      const activeMissions = userMissions.filter(
        m => m.status !== 'completed' && m.status !== 'cancelled' && m.status !== 'failed'
      );
      setMissions(activeMissions);

      if (!selectedMissionId && activeMissions.length > 0) {
        setSelectedMissionId(activeMissions[0].missionId);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
    }
  }

  async function loadMissionData() {
    try {
      setLoading(true);
      const missionData = await getMission(selectedMissionId);
      setMission(missionData);
    } catch (error) {
      console.error('Error loading mission:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMissionUpdates() {
    if (!selectedMissionId) return;

    const missionQuery = query(
      collection(db, 'missionTracking'),
      where('missionId', '==', selectedMissionId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(missionQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestTracking = snapshot.docs[0].data();
        setTracking(latestTracking);
      }
    });
  }

  function getStatusDisplay(status: string) {
    const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
      pending: { label: 'Finding Driver', icon: '⏳', color: '#ffa726' },
      assigned: { label: 'Driver Assigned', icon: '✓', color: '#66bb6a' },
      driver_en_route: { label: 'Driver En Route', icon: '🚗', color: '#42a5f5' },
      driver_arrived: { label: 'Driver Arrived', icon: '📍', color: '#ab47bc' },
      in_progress: { label: 'Mission In Progress', icon: '🔄', color: '#26c6da' },
      completed: { label: 'Completed', icon: '✅', color: '#66bb6a' },
      cancelled: { label: 'Cancelled', icon: '❌', color: '#ef5350' },
      failed: { label: 'Failed', icon: '⚠️', color: '#ef5350' },
    };

    return statusConfig[status] || statusConfig.pending;
  }

  function renderMissionSelector() {
    if (missions.length === 0) return null;

    return (
      <View style={styles.missionSelector}>
        <Text style={styles.selectorLabel}>Active Missions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {missions.map((m) => (
            <TouchableOpacity
              key={m.missionId}
              style={[
                styles.missionChip,
                selectedMissionId === m.missionId && styles.missionChipSelected,
              ]}
              onPress={() => setSelectedMissionId(m.missionId)}
            >
              <Text
                style={[
                  styles.missionChipText,
                  selectedMissionId === m.missionId && styles.missionChipTextSelected,
                ]}
              >
                {m.missionCode}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  function renderTrackingInfo() {
    if (!tracking) return null;

    const etaMinutes = Math.floor(tracking.etaSeconds / 60);
    const distanceKm = tracking.distanceRemaining?.toFixed(1) || '0.0';

    return (
      <View style={styles.trackingCard}>
        <View style={styles.trackingRow}>
          <View style={styles.trackingItem}>
            <Text style={styles.trackingLabel}>ETA</Text>
            <Text style={styles.trackingValue}>{etaMinutes} min</Text>
          </View>
          <View style={styles.trackingSeparator} />
          <View style={styles.trackingItem}>
            <Text style={styles.trackingLabel}>Distance</Text>
            <Text style={styles.trackingValue}>{distanceKm} km</Text>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4facfe" />
        <Text style={styles.loadingText}>Loading mission...</Text>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.gradient}>
          <Text style={styles.emptyTitle}>No Active Missions</Text>
          <Text style={styles.emptySubtitle}>Book a mission to start tracking</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/on-time-home')}
          >
            <Text style={styles.primaryButtonText}>Book Mission</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const statusDisplay = getStatusDisplay(mission.status);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mission Tracking</Text>
            <Text style={styles.headerSubtitle}>{mission.missionCode}</Text>
          </View>
        </View>

        {renderMissionSelector()}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statusCard}>
            <LinearGradient
              colors={[statusDisplay.color, statusDisplay.color + '88']}
              style={styles.statusGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statusIcon}>{statusDisplay.icon}</Text>
              <Text style={styles.statusLabel}>{statusDisplay.label}</Text>
            </LinearGradient>
          </View>

          {renderTrackingInfo()}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Mission Details</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>
                  {mission.type === 'person' ? '🚗 Person Transport' : '📄 Document Delivery'}
                </Text>
              </View>
              <View style={styles.detailSeparator} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Security Level</Text>
                <Text style={styles.detailValue}>
                  {mission.securityLevel.toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailSeparator} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Price</Text>
                <Text style={styles.detailValue}>€{mission.totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Locations</Text>

            <View style={styles.locationCard}>
              <View style={styles.locationItem}>
                <View style={styles.locationIconContainer}>
                  <Text style={styles.locationIcon}>📍</Text>
                </View>
                <View style={styles.locationContent}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>{mission.pickup.address}</Text>
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
                  <Text style={styles.locationAddress}>{mission.dropoff.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {mission.driverCode && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Driver Information</Text>
              <View style={styles.driverCard}>
                <Text style={styles.driverCode}>Driver: {mission.driverCode}</Text>
                <Text style={styles.driverNote}>Anonymous for your privacy</Text>
              </View>
            </View>
          )}

          {mission.confirmationCode && (
            <View style={styles.confirmationCard}>
              <Text style={styles.confirmationLabel}>Confirmation Code</Text>
              <Text style={styles.confirmationCode}>{mission.confirmationCode}</Text>
              <Text style={styles.confirmationNote}>
                Show this code to confirm mission completion
              </Text>
            </View>
          )}
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
    marginTop: 16,
    fontSize: 16,
    color: '#a0a0c0',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a0a0c0',
    marginBottom: 32,
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
  missionSelector: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  missionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  missionChipSelected: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe',
  },
  missionChipText: {
    fontSize: 14,
    color: '#a0a0c0',
    fontWeight: '500',
  },
  missionChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  statusCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusGradient: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  trackingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  trackingRow: {
    flexDirection: 'row',
    padding: 20,
  },
  trackingItem: {
    flex: 1,
    alignItems: 'center',
  },
  trackingLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trackingValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  trackingSeparator: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
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
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#a0a0c0',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
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
  driverCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  driverCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  driverNote: {
    fontSize: 12,
    color: '#a0a0c0',
  },
  confirmationCard: {
    backgroundColor: 'rgba(79, 172, 254, 0.2)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
  },
  confirmationLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  confirmationCode: {
    fontSize: 36,
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
});
