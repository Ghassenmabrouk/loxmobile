import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { RideService } from '@/app/services/ride';
import type { Ride } from '@/app/types/ride';

export default function RidesScreen() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      if (!user?.uid) return;

      try {
        const userRides = await RideService.getUserRides(user.uid);
        setRides(userRides);
      } catch (error) {
        console.error('Failed to fetch rides:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return '#D4AF37';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#ff5252';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
      </View>

      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color="#e0e0e0" />
          <Text style={styles.emptyText}>No rides yet</Text>
          <Text style={styles.emptySubtext}>Book your first luxury ride</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <View style={styles.dateTime}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.dateTimeText}>{item.pickupDate}</Text>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.dateTimeText}>{item.pickupTime}</Text>
                </View>
                <Text style={[
                  styles.status,
                  { color: getStatusColor(item.status) }
                ]}>
                  {getStatusText(item.status)}
                </Text>
              </View>

              <View style={styles.locations}>
                <View style={styles.location}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.pickupLocation?.locationName || 'Pickup location'}
                  </Text>
                </View>
                <View style={styles.location}>
                  <Ionicons name="location" size={16} color="#D4AF37" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.destinations?.[0]?.destinationName || 'Destination'}
                  </Text>
                </View>
              </View>

              <View style={styles.rideFooter}>
                <Text style={styles.carName}>{item.carMake}</Text>
                {item.estimatedPrice && (
                  <Text style={styles.priceText}>${item.estimatedPrice}</Text>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 32,
    color: '#1a1a1a',
  },
  list: {
    padding: 20,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 12,
  },
  status: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  locations: {
    marginBottom: 12,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  carName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
});