import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { X, MapPin, Flag, User, Phone, Clock, Navigation } from 'lucide-react-native';
import { NavigationMap } from '@/components/NavigationMap';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/services/firebase';

interface RideDetails {
  id: string;
  userId: string;
  name: string;
  contact: string;
  pickupLocation: {
    coordinates: string;
    locationName: string;
  };
  destinations: Array<{
    location: string;
    destinationName: string;
  }>;
  estimatedPrice: string;
  status: string;
  startedAt?: string;
}

export default function ActiveRideNavigation() {
  const params = useLocalSearchParams();
  const rideId = params.rideId as string;
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRideDetails();
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      const rideDoc = await getDoc(doc(db, 'rides', rideId));
      if (rideDoc.exists()) {
        const data = rideDoc.data();
        setRide({
          id: rideDoc.id,
          userId: data.userId,
          name: data.name,
          contact: data.contact || 'N/A',
          pickupLocation: data.pickupLocation,
          destinations: data.destinations,
          estimatedPrice: data.estimatedPrice,
          status: data.status,
          startedAt: data.startedAt,
        });
      }
    } catch (error) {
      console.error('Error loading ride:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleEndRide = async () => {
    Alert.alert(
      'End Ride',
      'Have you reached the destination?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, End Ride',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'rides', rideId), {
                status: 'completed',
                endTime: new Date(),
              });
              Alert.alert('Success', 'Ride completed!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/driver-home') }
              ]);
            } catch (error) {
              console.error('Error ending ride:', error);
              Alert.alert('Error', 'Failed to end ride');
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    Alert.alert(
      'Close Navigation',
      'Are you sure? The ride is still active.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close', onPress: () => router.back() },
      ]
    );
  };

  if (loading || !ride) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#0a0a0a']}
        style={styles.gradient}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Navigation size={20} color="#D4AF37" />
            <Text style={styles.headerTitle}>Active Navigation</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <NavigationMap
            destination={{
              latitude: parseFloat(ride.destinations[0].location.split(',')[0]),
              longitude: parseFloat(ride.destinations[0].location.split(',')[1]),
            }}
            pickupLocation={{
              latitude: parseFloat(ride.pickupLocation.coordinates.split(',')[0]),
              longitude: parseFloat(ride.pickupLocation.coordinates.split(',')[1]),
            }}
          />
        </View>

        {/* Ride Information Panel */}
        <ScrollView style={styles.infoPanel} showsVerticalScrollIndicator={false}>
          {/* Passenger Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={18} color="#D4AF37" />
              <Text style={styles.sectionTitle}>Passenger</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{ride.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{ride.contact}</Text>
            </View>
          </View>

          {/* Trip Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color="#D4AF37" />
              <Text style={styles.sectionTitle}>Trip Details</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.locationDot} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>{ride.pickupLocation.locationName}</Text>
              </View>
            </View>
            <View style={styles.locationConnector} />
            <View style={styles.locationRow}>
              <Flag size={16} color="#D4AF37" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationText}>{ride.destinations[0].destinationName}</Text>
              </View>
            </View>
          </View>

          {/* Fare Info */}
          <View style={styles.section}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Fare</Text>
              <Text style={styles.fareValue}>${ride.estimatedPrice}</Text>
            </View>
          </View>

          {/* Start Time */}
          {ride.startedAt && (
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <Clock size={16} color="#D4AF37" />
                <Text style={styles.timeText}>
                  Started at {new Date(ride.startedAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* End Ride Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.endRideButton}
            onPress={handleEndRide}>
            <LinearGradient
              colors={['#D4AF37', '#C4A137']}
              style={styles.endRideGradient}>
              <Flag size={20} color="#000" />
              <Text style={styles.endRideText}>End Ride</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  infoPanel: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
    marginTop: 2,
  },
  locationConnector: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginLeft: 7,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 16,
    color: '#999',
  },
  fareValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
  },
  timeText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  endRideButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  endRideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  endRideText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
});
