import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/services/firebase';
import { driverService } from '@/app/services/driverService';
import { useLocation } from '@/hooks/useLocation';
import { NavigationMap } from '@/components/NavigationMap';

interface RideDetail {
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
    idCard: string;
    car: {
      model: string;
      licensePlate: string;
    };
  };
}

export default function DriverRideDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [ride, setRide] = useState<RideDetail | null>(null);
  const [isAtPickup, setIsAtPickup] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);
  const { location } = useLocation({ continuous: true });

  useEffect(() => {
    if (!id) return;

    const rideRef = doc(db, 'rides', id as string);
    const unsubscribe = onSnapshot(rideRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() } as RideDetail;
        setRide(data);
        setRideStarted(data.status === 'in-progress');
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleArrivedAtPickup = async () => {
    if (!ride || !user?.uid) return;

    try {
      const rideRef = doc(db, 'rides', ride.id);
      await updateDoc(rideRef, {
        status: 'driver-arrived',
        arrivedAt: new Date().toISOString()
      });

      await driverService.setDriverStatus(user.uid, 'on-ride');

      setIsAtPickup(true);
      Alert.alert('Success', 'Passenger has been notified of your arrival');
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleStartRide = async () => {
    if (!ride || !user?.uid) return;

    try {
      const rideRef = doc(db, 'rides', ride.id);
      await updateDoc(rideRef, {
        status: 'in-progress',
        startedAt: new Date().toISOString()
      });
      setRideStarted(true);

      router.push(`/(tabs)/active-ride-navigation?rideId=${ride.id}`);
    } catch (error) {
      console.error('Failed to start ride:', error);
      Alert.alert('Error', 'Failed to start ride');
    }
  };

  const handleCompleteRide = async () => {
    if (!ride || !user?.uid) return;

    Alert.alert(
      'Complete Ride',
      'Mark this ride as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const rideRef = doc(db, 'rides', ride.id);
              await updateDoc(rideRef, {
                status: 'completed',
                completedAt: new Date().toISOString()
              });

              await driverService.setDriverStatus(user.uid, 'online');

              Alert.alert('Success', 'Ride completed! You are now online and available for new rides.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Failed to complete ride:', error);
              Alert.alert('Error', 'Failed to complete ride');
            }
          }
        }
      ]
    );
  };

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {rideStarted && location && ride.destinations?.[0]?.location && (() => {
          try {
            const destCoords = ride.destinations[0].location.split(',');
            const destLat = parseFloat(destCoords[0].trim());
            const destLng = parseFloat(destCoords[1].trim());
            if (!isNaN(destLat) && !isNaN(destLng)) {
              return (
                <NavigationMap
                  driverLocation={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  destination={{
                    latitude: destLat,
                    longitude: destLng,
                  }}
                  destinationName={ride.destinations[0].destinationName}
                />
              );
            }
          } catch (e) {
            console.error('Error parsing destination coordinates:', e);
          }
          return null;
        })()}

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Ride Status</Text>
            <View style={[
              styles.statusBadge,
              rideStarted ? styles.statusBadgeActive : styles.statusBadgeScheduled
            ]}>
              <Text style={styles.statusBadgeText}>
                {rideStarted ? 'IN PROGRESS' : 'SCHEDULED'}
              </Text>
            </View>
          </View>

          <View style={styles.statusSteps}>
            <View style={[styles.step, styles.stepCompleted]}>
              <View style={styles.stepDot}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.stepText}>Ride Accepted</Text>
            </View>

            <View style={[styles.step, isAtPickup && styles.stepCompleted]}>
              <View style={styles.stepDot}>
                {isAtPickup && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.stepText}>Arrived at Pickup</Text>
            </View>

            <View style={[styles.step, rideStarted && styles.stepCompleted]}>
              <View style={styles.stepDot}>
                {rideStarted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.stepText}>Ride Started</Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>Destination Reached</Text>
            </View>
          </View>
        </View>

        <View style={styles.passengerCard}>
          <Text style={styles.sectionTitle}>Passenger Information</Text>
          <View style={styles.passengerInfo}>
            <View style={styles.passengerAvatar}>
              <Ionicons name="person" size={32} color="#D4AF37" />
            </View>
            <View style={styles.passengerDetails}>
              <Text style={styles.passengerName}>{ride.name}</Text>
              <Text style={styles.passengerMeta}>
                {ride.passengers} {ride.passengers === 1 ? 'passenger' : 'passengers'}
              </Text>
              {ride.contact && (
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>{ride.contact}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Ionicons name="calendar" size={20} color="#D4AF37" />
              <Text style={styles.timeText}>{ride.pickupDate}</Text>
            </View>
            <View style={styles.timeItem}>
              <Ionicons name="time" size={20} color="#D4AF37" />
              <Text style={styles.timeText}>{ride.pickupTime}</Text>
            </View>
          </View>

          <View style={styles.locationsList}>
            <View style={styles.locationItem}>
              <View style={styles.locationIcon}>
                <View style={styles.pickupDot} />
              </View>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                <Text style={styles.locationAddress}>
                  {ride.pickupLocation?.locationName || 'Pickup location'}
                </Text>
              </View>
            </View>

            <View style={styles.routeLineContainer}>
              <View style={styles.routeLineFull} />
            </View>

            <View style={styles.locationItem}>
              <View style={styles.locationIcon}>
                <View style={styles.destinationDot} />
              </View>
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>DESTINATION</Text>
                <Text style={styles.locationAddress}>
                  {ride.destinations?.[0]?.destinationName || 'Destination'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleItem}>
              <Ionicons name="car" size={20} color="#666" />
              <Text style={styles.vehicleText}>{ride.carMake}</Text>
            </View>
            <View style={styles.vehicleItem}>
              <Ionicons name="cash" size={20} color="#666" />
              <Text style={styles.vehicleText}>${ride.estimatedPrice}</Text>
            </View>
          </View>
        </View>

        {!rideStarted && !isAtPickup && (
          <TouchableOpacity style={styles.actionButton} onPress={handleArrivedAtPickup}>
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="location" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>I've Arrived at Pickup</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isAtPickup && !rideStarted && (
          <TouchableOpacity style={styles.actionButton} onPress={handleStartRide}>
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="play-circle" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Start Ride</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {rideStarted && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCompleteRide}>
            <LinearGradient
              colors={['#D4AF37', '#C5A028']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#1A1A1A" />
              <Text style={styles.completeButtonText}>Complete Ride</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeScheduled: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeActive: {
    backgroundColor: '#2196F3',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusSteps: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCompleted: {
    opacity: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#666',
  },
  passengerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  passengerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  passengerMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timeInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  locationsList: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 32,
    alignItems: 'center',
    paddingTop: 4,
  },
  pickupDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
  },
  destinationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D4AF37',
  },
  routeLineContainer: {
    height: 24,
    width: 32,
    alignItems: 'center',
  },
  routeLineFull: {
    width: 3,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  locationContent: {
    flex: 1,
    paddingBottom: 4,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
    lineHeight: 20,
  },
  vehicleInfo: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleText: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
});
