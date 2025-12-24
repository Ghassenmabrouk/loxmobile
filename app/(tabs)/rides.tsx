import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      <LinearGradient
        colors={['#1A1A1A', '#2A2A2A', '#F8F8F8']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Journey History</Text>
            <Text style={styles.subtitle}>{rides.length} total rides</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="funnel-outline" size={20} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#F8F8F8', '#FFFFFF']}
            style={styles.emptyContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="car-outline" size={80} color="#D4AF37" />
            <Text style={styles.emptyText}>No Journeys Yet</Text>
            <Text style={styles.emptySubtext}>Begin your luxury experience today</Text>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                <LinearGradient
                  colors={
                    item.status === 'completed'
                      ? ['#4CAF50', '#45A049']
                      : item.status === 'cancelled'
                      ? ['#FF5252', '#E04848']
                      : ['#D4AF37', '#C5A028']
                  }
                  style={styles.timelineDot}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={
                      item.status === 'completed'
                        ? 'checkmark'
                        : item.status === 'cancelled'
                        ? 'close'
                        : 'time'
                    }
                    size={14}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                {index < rides.length - 1 && <View style={styles.connector} />}
              </View>

              <View style={styles.rideCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8F8F8']}
                  style={styles.rideCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <View style={styles.rideHeader}>
                    <View style={styles.dateTimeContainer}>
                      <Text style={styles.dateText}>{item.pickupDate}</Text>
                      <Text style={styles.timeText}>{item.pickupTime}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}15` }
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(item.status) }
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(item.status) }
                        ]}
                      >
                        {getStatusText(item.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeContainer}>
                    <View style={styles.routePoint}>
                      <View style={styles.pickupDot} />
                      <Text style={styles.locationLabel} numberOfLines={1}>
                        {item.pickupLocation?.locationName || 'Pickup location'}
                      </Text>
                    </View>

                    <View style={styles.routeDivider}>
                      <View style={styles.dottedLine} />
                      <Ionicons name="arrow-down" size={14} color="#D4AF37" />
                    </View>

                    <View style={styles.routePoint}>
                      <View style={styles.destinationDot} />
                      <Text style={styles.locationLabel} numberOfLines={1}>
                        {item.destinations?.[0]?.destinationName || 'Destination'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rideFooter}>
                    <View style={styles.carInfo}>
                      <Ionicons name="car-sport" size={16} color="#666" />
                      <Text style={styles.carName}>{item.carMake}</Text>
                    </View>
                    {item.estimatedPrice && (
                      <Text style={styles.priceText}>${item.estimatedPrice}</Text>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLine: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
  },
  rideCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  rideCardGradient: {
    padding: 16,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  routeContainer: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D4AF37',
  },
  locationLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  routeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 4,
    gap: 8,
  },
  dottedLine: {
    width: 2,
    height: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
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
  emptyContent: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    letterSpacing: 0.3,
  },
});