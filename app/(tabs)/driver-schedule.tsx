import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/services/firebase';

interface ScheduledRide {
  id: string;
  name: string;
  userId: string;
  pickupLocation: {
    coordinates: string;
    locationName: string;
  };
  destinations: Array<{
    location: string;
    destinationName: string;
  }>;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  carMake: string;
  estimatedPrice: string;
  status: string;
  contact?: string;
  driverDetails?: {
    name: string;
    car: {
      model: string;
      licensePlate: string;
    };
  };
}

export default function DriverScheduleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const ridesRef = collection(db, 'rides');
    const scheduledQuery = query(
      ridesRef,
      where('driverDetails.idCard', '==', user.uid),
      where('status', 'in', ['accepted', 'in-progress'])
    );

    const unsubscribe = onSnapshot(scheduledQuery, (snapshot) => {
      const rides: ScheduledRide[] = [];
      snapshot.forEach((doc) => {
        rides.push({
          id: doc.id,
          ...doc.data()
        } as ScheduledRide);
      });

      rides.sort((a, b) => {
        const dateA = new Date(`${a.pickupDate} ${a.pickupTime}`);
        const dateB = new Date(`${b.pickupDate} ${b.pickupTime}`);
        return dateA.getTime() - dateB.getTime();
      });

      setScheduledRides(rides);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRidePress = (rideId: string) => {
    router.push(`/(tabs)/driver-ride-detail?id=${rideId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#4CAF50';
      case 'in-progress':
        return '#2196F3';
      case 'completed':
        return '#9E9E9E';
      default:
        return '#FFC107';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Scheduled';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{scheduledRides.length}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {scheduledRides.filter(r => r.status === 'accepted').length}
            </Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {scheduledRides.filter(r => r.status === 'in-progress').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Scheduled Rides</Text>
          <Text style={styles.sectionSubtitle}>
            {scheduledRides.length} {scheduledRides.length === 1 ? 'ride' : 'rides'}
          </Text>
        </View>

        {scheduledRides.length > 0 ? (
          scheduledRides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={styles.rideCard}
              onPress={() => handleRidePress(ride.id)}
            >
              <View style={styles.rideCardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
                </View>
                <Text style={styles.priceText}>${ride.estimatedPrice}</Text>
              </View>

              <View style={styles.rideCardBody}>
                <View style={styles.passengerRow}>
                  <View style={styles.passengerAvatar}>
                    <Ionicons name="person" size={20} color="#D4AF37" />
                  </View>
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{ride.name}</Text>
                    <Text style={styles.passengerDetails}>
                      {ride.passengers} {ride.passengers === 1 ? 'passenger' : 'passengers'} · {ride.carMake}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.timeText}>{ride.pickupDate}</Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.timeText}>{ride.pickupTime}</Text>
                  </View>
                </View>

                <View style={styles.locationContainer}>
                  <View style={styles.locationRow}>
                    <View style={styles.locationDot} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {ride.pickupLocation?.locationName || 'Pickup location'}
                    </Text>
                  </View>
                  <View style={styles.locationLine} />
                  <View style={styles.locationRow}>
                    <View style={[styles.locationDot, styles.locationDotDestination]} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {ride.destinations?.[0]?.destinationName || 'Destination'}
                    </Text>
                  </View>
                </View>

                {ride.contact && (
                  <View style={styles.contactRow}>
                    <Ionicons name="call" size={16} color="#D4AF37" />
                    <Text style={styles.contactText}>{ride.contact}</Text>
                  </View>
                )}
              </View>

              <View style={styles.rideCardFooter}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No scheduled rides</Text>
            <Text style={styles.emptyText}>Accepted rides will appear here</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  rideCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  rideCardBody: {
    padding: 16,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  passengerDetails: {
    fontSize: 13,
    color: '#666',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  locationDotDestination: {
    backgroundColor: '#D4AF37',
  },
  locationLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 4,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  rideCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#BBB',
  },
});
