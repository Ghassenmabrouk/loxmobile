import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/app/services/firebase';

interface RideRequest {
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
  distance?: number;
  contact?: string;
}

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [acceptedRides, setAcceptedRides] = useState<RideRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const MOCK_DISTANCES = [0.8, 1.2, 2.5, 3.1, 4.5, 1.8, 2.9];

  useEffect(() => {
    if (!user?.uid) return;

    const ridesRef = collection(db, 'rides');
    const availableRidesQuery = query(
      ridesRef,
      where('status', '==', 'pending')
    );

    const acceptedRidesQuery = query(
      ridesRef,
      where('driverDetails.idCard', '==', user.uid),
      where('status', 'in', ['accepted', 'in-progress'])
    );

    const unsubscribeAvailable = onSnapshot(availableRidesQuery, (snapshot) => {
      const requests: RideRequest[] = [];
      snapshot.forEach((doc, index) => {
        requests.push({
          id: doc.id,
          ...doc.data(),
          distance: MOCK_DISTANCES[index % MOCK_DISTANCES.length]
        } as RideRequest);
      });

      requests.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setRideRequests(requests);
    });

    const unsubscribeAccepted = onSnapshot(acceptedRidesQuery, (snapshot) => {
      const accepted: RideRequest[] = [];
      snapshot.forEach((doc) => {
        accepted.push({
          id: doc.id,
          ...doc.data()
        } as RideRequest);
      });
      setAcceptedRides(accepted);
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeAccepted();
    };
  }, [user]);

  const handleAcceptRide = async (rideId: string) => {
    if (!user?.uid) return;

    try {
      const rideRef = doc(db, 'rides', rideId);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      await updateDoc(rideRef, {
        status: 'accepted',
        'driverDetails.idCard': user.uid,
        'driverDetails.name': user.displayName || userData?.firstName + ' ' + userData?.lastName || 'Driver',
        'driverDetails.car.model': 'Mercedes S-Class',
        'driverDetails.car.licensePlate': 'ABC-1234',
        'driverDetails.car.class': 'Luxury',
        acceptedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to accept ride:', error);
    }
  };

  const handleViewSchedule = () => {
    router.push('/(tabs)/driver-schedule');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <LinearGradient
          colors={['#1A1A1A', '#2A2A2A', '#F8F8F8']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: user?.photoURL || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.avatar}
              />
              <View style={styles.userTextContainer}>
                <Text style={styles.greeting}>Driver Dashboard</Text>
                <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0] || 'Driver'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.statusButton, isOnline && styles.statusButtonOnline]}
              onPress={() => setIsOnline(!isOnline)}
            >
              <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
              <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>{acceptedRides.length}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={handleViewSchedule}>
            <Ionicons name="list" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>{acceptedRides.length}</Text>
            <Text style={styles.statLabel}>My Schedule</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Ionicons name="car" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>{rideRequests.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ride Requests</Text>
          <Text style={styles.sectionSubtitle}>Sorted by distance</Text>
        </View>

        {isOnline ? (
          rideRequests.length > 0 ? (
            rideRequests.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideHeader}>
                  <View style={styles.distanceBadge}>
                    <Ionicons name="navigate" size={14} color="#1A1A1A" />
                    <Text style={styles.distanceText}>{ride.distance?.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>${ride.estimatedPrice}</Text>
                  </View>
                </View>

                <View style={styles.rideBody}>
                  <View style={styles.passengerInfo}>
                    <View style={styles.passengerAvatar}>
                      <Ionicons name="person" size={20} color="#D4AF37" />
                    </View>
                    <View style={styles.passengerDetails}>
                      <Text style={styles.passengerName}>{ride.name}</Text>
                      <Text style={styles.passengerCount}>
                        {ride.passengers} {ride.passengers === 1 ? 'passenger' : 'passengers'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationContainer}>
                    <View style={styles.locationRow}>
                      <View style={styles.locationDot} />
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>PICKUP</Text>
                        <Text style={styles.locationText} numberOfLines={1}>
                          {ride.pickupLocation?.locationName || 'Unknown'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.locationLine} />

                    <View style={styles.locationRow}>
                      <View style={[styles.locationDot, styles.locationDotDestination]} />
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>DESTINATION</Text>
                        <Text style={styles.locationText} numberOfLines={1}>
                          {ride.destinations?.[0]?.destinationName || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rideDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{ride.pickupDate}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{ride.pickupTime}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="car-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{ride.carMake}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRide(ride.id)}
                >
                  <LinearGradient
                    colors={['#D4AF37', '#C5A028']}
                    style={styles.acceptButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.acceptButtonText}>Accept Ride</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#1A1A1A" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color="#CCC" />
              <Text style={styles.emptyTitle}>No ride requests</Text>
              <Text style={styles.emptyText}>New requests will appear here</Text>
            </View>
          )
        ) : (
          <View style={styles.offlineState}>
            <Ionicons name="moon" size={64} color="#CCC" />
            <Text style={styles.offlineTitle}>You're offline</Text>
            <Text style={styles.offlineText}>Go online to see ride requests</Text>
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    marginBottom: -16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
  },
  userTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#D4AF37',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusButtonOnline: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  statusTextOnline: {
    color: '#4CAF50',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 24,
    marginHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.3,
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
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  rideBody: {
    padding: 16,
  },
  passengerInfo: {
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
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  passengerCount: {
    fontSize: 13,
    color: '#666',
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginTop: 4,
    marginRight: 12,
  },
  locationDotDestination: {
    backgroundColor: '#D4AF37',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  rideDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  acceptButton: {
    overflow: 'hidden',
    borderRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
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
  offlineState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#BBB',
  },
});
