import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { getDriverMissions, acceptMission } from '@/app/services/missionService';
import { Mission } from '@/app/types/mission';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/app/services/firebase';

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'active' | 'available'>('active');

  useEffect(() => {
    if (user) {
      loadMissions();
      const unsubscribe = subscribeToMissions();
      return () => unsubscribe && unsubscribe();
    }
  }, [user]);

  async function loadMissions() {
    if (!user) return;

    try {
      setLoading(true);
      const missions = await getDriverMissions(user.uid);

      const active = missions.filter(
        m => m.status !== 'completed' && m.status !== 'cancelled' && m.status !== 'failed'
      );

      setActiveMissions(active);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMissions() {
    if (!user) return;

    const availableQuery = query(
      collection(db, 'missions'),
      where('status', '==', 'pending'),
      orderBy('scheduledFor', 'asc')
    );

    return onSnapshot(availableQuery, (snapshot) => {
      const missions: Mission[] = [];
      snapshot.forEach((doc) => {
        missions.push({ missionId: doc.id, ...doc.data() } as Mission);
      });
      setAvailableMissions(missions);
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  }

  async function handleAcceptMission(missionId: string) {
    if (!user) return;

    try {
      await acceptMission(missionId, user.uid);
      await loadMissions();
      router.push(`/driver-mission-view?missionId=${missionId}`);
    } catch (error) {
      console.error('Error accepting mission:', error);
    }
  }

  function getSecurityIcon(level: string): string {
    const icons: Record<string, string> = {
      standard: '🟢',
      discreet: '🔵',
      confidential: '🟠',
      critical: '🔴',
    };
    return icons[level] || '🟢';
  }

  function renderMissionCard(mission: Mission, isAvailable: boolean = false) {
    return (
      <TouchableOpacity
        key={mission.missionId}
        style={styles.missionCard}
        onPress={() => {
          if (isAvailable) {
            handleAcceptMission(mission.missionId);
          } else {
            router.push(`/driver-mission-view?missionId=${mission.missionId}`);
          }
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isAvailable
              ? ['rgba(79, 172, 254, 0.2)', 'rgba(79, 172, 254, 0.05)']
              : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
          }
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.missionInfo}>
              <Text style={styles.missionCode}>{mission.missionCode}</Text>
              <Text style={styles.clientCode}>Client: {mission.clientCode}</Text>
            </View>

            <View style={styles.securityIndicator}>
              <Text style={styles.securityIcon}>
                {getSecurityIcon(mission.securityLevel)}
              </Text>
              <Text style={styles.securityLevel}>
                {mission.securityLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.missionType}>
              <Text style={styles.typeIcon}>
                {mission.type === 'person' ? '🚗' : '📄'}
              </Text>
              <Text style={styles.typeLabel}>
                {mission.type === 'person' ? 'Person Transport' : 'Document Delivery'}
              </Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>📍</Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  {mission.pickup.address}
                </Text>
              </View>

              <View style={styles.routeArrow}>
                <Text style={styles.arrowIcon}>↓</Text>
              </View>

              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>🎯</Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  {mission.dropoff.address}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.timeInfo}>
                <Text style={styles.timeIcon}>🕐</Text>
                <Text style={styles.timeText}>
                  {new Date(mission.scheduledFor).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <Text style={styles.durationText}>
                ~{mission.estimatedDuration} min
              </Text>
            </View>

            {isAvailable && (
              <View style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>✓ Accept Mission</Text>
              </View>
            )}

            {!isAvailable && (
              <View style={styles.statusIndicator}>
                <Text style={styles.statusText}>
                  {mission.status === 'assigned' && '📋 Assigned - Start driving'}
                  {mission.status === 'driver_en_route' && '🚗 En route to pickup'}
                  {mission.status === 'driver_arrived' && '📍 Arrived - Ready to start'}
                  {mission.status === 'in_progress' && '▶️ Mission in progress'}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.gradient}>
          <ActivityIndicator size="large" color="#4facfe" />
          <Text style={styles.loadingText}>Loading missions...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
            <Text style={styles.headerSubtitle}>ON TIME Platform</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewSelector}>
          <TouchableOpacity
            style={[styles.viewButton, view === 'active' && styles.viewButtonActive]}
            onPress={() => setView('active')}
          >
            <Text style={[styles.viewButtonText, view === 'active' && styles.viewButtonTextActive]}>
              Active ({activeMissions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewButton, view === 'available' && styles.viewButtonActive]}
            onPress={() => setView('available')}
          >
            <Text style={[styles.viewButtonText, view === 'available' && styles.viewButtonTextActive]}>
              Available ({availableMissions.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4facfe"
            />
          }
        >
          {view === 'active' && (
            <>
              {activeMissions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyTitle}>No Active Missions</Text>
                  <Text style={styles.emptySubtitle}>
                    Check available missions to start earning
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setView('available')}
                  >
                    <Text style={styles.primaryButtonText}>View Available</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                activeMissions.map(m => renderMissionCard(m, false))
              )}
            </>
          )}

          {view === 'available' && (
            <>
              {availableMissions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No Available Missions</Text>
                  <Text style={styles.emptySubtitle}>
                    New missions will appear here automatically
                  </Text>
                </View>
              ) : (
                availableMissions.map(m => renderMissionCard(m, true))
              )}
            </>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0c0',
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  viewSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  viewButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewButtonActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe',
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a0a0c0',
  },
  viewButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a0a0c0',
  },
  missionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  missionInfo: {
    flex: 1,
  },
  missionCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  clientCode: {
    fontSize: 13,
    color: '#a0a0c0',
  },
  securityIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  securityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  securityLevel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  cardBody: {
    gap: 12,
  },
  missionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  routeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeIcon: {
    fontSize: 16,
  },
  routeText: {
    flex: 1,
    fontSize: 13,
    color: '#a0a0c0',
  },
  routeArrow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#4facfe',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 13,
    color: '#a0a0c0',
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4facfe',
  },
  acceptButton: {
    backgroundColor: '#4facfe',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusIndicator: {
    backgroundColor: 'rgba(79, 172, 254, 0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4facfe',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
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
    textAlign: 'center',
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
});
