import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { getClientMissions } from '@/app/services/missionService';
import { generateAndDownloadReport } from '@/app/services/pdfReportService';
import { Mission } from '@/app/types/mission';
import { authService } from '@/app/services/authService';

export default function MissionHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (user) {
      initializeAndLoadMissions();
    }
  }, [user, filter]);

  async function initializeAndLoadMissions() {
    if (!user) return;

    try {
      await authService.migrateUserDocument(user.uid);
      await loadMissions();
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  async function loadMissions() {
    if (!user) return;

    try {
      setLoading(true);
      const allMissions = await getClientMissions(user.uid);

      let filtered = allMissions;
      if (filter === 'completed') {
        filtered = allMissions.filter(m => m.status === 'completed');
      } else if (filter === 'cancelled') {
        filtered = allMissions.filter(m => m.status === 'cancelled' || m.status === 'failed');
      }

      filtered.sort((a, b) => {
        const dateA = new Date(a.scheduledFor).getTime();
        const dateB = new Date(b.scheduledFor).getTime();
        return dateB - dateA;
      });

      setMissions(filtered);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadReport(mission: Mission) {
    if (mission.type !== 'document') {
      Alert.alert('Not Available', 'Reports are only available for document delivery missions.');
      return;
    }

    try {
      await generateAndDownloadReport(mission.missionId);
      Alert.alert('Success', 'Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      Alert.alert('Error', 'Failed to download report. Please try again.');
    }
  }

  function getStatusDisplay(status: string) {
    const displays: Record<string, { label: string; icon: string; color: string[] }> = {
      pending: { label: 'Pending', icon: '⏳', color: ['#ffa726', '#fb8c00'] },
      assigned: { label: 'Assigned', icon: '✓', color: ['#66bb6a', '#43a047'] },
      driver_en_route: { label: 'En Route', icon: '🚗', color: ['#42a5f5', '#1e88e5'] },
      driver_arrived: { label: 'Arrived', icon: '📍', color: ['#ab47bc', '#8e24aa'] },
      in_progress: { label: 'In Progress', icon: '🔄', color: ['#26c6da', '#00acc1'] },
      completed: { label: 'Completed', icon: '✅', color: ['#66bb6a', '#43a047'] },
      cancelled: { label: 'Cancelled', icon: '❌', color: ['#ef5350', '#e53935'] },
      failed: { label: 'Failed', icon: '⚠️', color: ['#ef5350', '#e53935'] },
    };
    return displays[status] || displays.pending;
  }

  function renderMissionCard(mission: Mission) {
    const statusDisplay = getStatusDisplay(mission.status);

    return (
      <TouchableOpacity
        key={mission.missionId}
        style={styles.missionCard}
        onPress={() => router.push(`/mission-tracking?missionId=${mission.missionId}`)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.missionCodeContainer}>
              <Text style={styles.missionCode}>{mission.missionCode}</Text>
              <Text style={styles.missionDate}>
                {new Date(mission.scheduledFor).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusDisplay.color[0] }]}>
              <Text style={styles.statusIcon}>{statusDisplay.icon}</Text>
              <Text style={styles.statusText}>{statusDisplay.label}</Text>
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
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {mission.pickup.address}
                </Text>
              </View>

              <View style={styles.routeArrow}>
                <Text style={styles.arrowText}>→</Text>
              </View>

              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>🎯</Text>
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {mission.dropoff.address}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.securityBadge}>
                <Text style={styles.securityText}>
                  {mission.securityLevel.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.priceText}>
                €{mission.totalPrice.toFixed(2)}
              </Text>
            </View>

            {mission.type === 'document' && mission.status === 'completed' && (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownloadReport(mission)}
              >
                <Text style={styles.downloadButtonText}>📄 Download Report</Text>
              </TouchableOpacity>
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mission History</Text>
            <Text style={styles.headerSubtitle}>{missions.length} missions</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setFilter('cancelled')}
          >
            <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {missions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Missions Found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'Start by booking your first mission'
                  : `No ${filter} missions yet`}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push('/on-time-home')}
                >
                  <Text style={styles.primaryButtonText}>Book Mission</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            missions.map(renderMissionCard)
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0c0',
  },
  filterTextActive: {
    color: '#ffffff',
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
  missionCodeContainer: {
    flex: 1,
  },
  missionCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  missionDate: {
    fontSize: 13,
    color: '#a0a0c0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  routeIcon: {
    fontSize: 16,
  },
  routeAddress: {
    flex: 1,
    fontSize: 13,
    color: '#a0a0c0',
  },
  routeArrow: {
    width: 24,
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#4facfe',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  securityBadge: {
    backgroundColor: 'rgba(79, 172, 254, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4facfe',
    letterSpacing: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  downloadButton: {
    backgroundColor: 'rgba(79, 172, 254, 0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
  },
  downloadButtonText: {
    fontSize: 14,
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
