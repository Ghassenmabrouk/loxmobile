import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/hooks/useLocation';
import LuxuryMapPlaceholder from '@/components/LuxuryMapPlaceholder';

let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
  Marker = require('react-native-maps').Marker;
  Polyline = require('react-native-maps').Polyline;
  PROVIDER_GOOGLE = require('react-native-maps').PROVIDER_GOOGLE;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DRIVER_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060,
};

const DESTINATION = {
  latitude: 40.7614,
  longitude: -73.9776,
};

export default function TrackScreen() {
  const mapRef = useRef<any>(null);
  const { location } = useLocation();
  const [driverLocation, setDriverLocation] = useState(DRIVER_LOCATION);
  const [estimatedTime, setEstimatedTime] = useState('15');
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const simulatedRoute = [
      DRIVER_LOCATION,
      { latitude: 40.7228, longitude: -73.9960 },
      { latitude: 40.7328, longitude: -73.9860 },
      { latitude: 40.7428, longitude: -73.9860 },
      { latitude: 40.7514, longitude: -73.9826 },
      DESTINATION,
    ];
    setRouteCoordinates(simulatedRoute);

    const interval = setInterval(() => {
      setDriverLocation(prev => ({
        latitude: prev.latitude + 0.0001,
        longitude: prev.longitude + 0.0001,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !mapRef.current) return;

    mapRef.current.fitToCoordinates(
      [driverLocation, DESTINATION],
      {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      }
    );
  }, [driverLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webMapContainer}>
            <LuxuryMapPlaceholder
              pickupLocation="Current Location"
              destination="Times Square, New York"
              eta={estimatedTime}
              driverLocation={driverLocation}
            />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              ...driverLocation,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}>
            <Marker coordinate={driverLocation}>
              <View style={styles.driverMarker}>
                <View style={styles.driverDot} />
              </View>
            </Marker>

            <Marker coordinate={DESTINATION}>
              <View style={styles.destinationMarker} />
            </Marker>

            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={3}
                strokeColor="#D4AF37"
              />
            )}
          </MapView>
        )}
      </View>

      <View style={styles.rideInfo}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Luxury Ride</Text>
            <Text style={styles.subtitle}>Driver en route to pickup</Text>
          </View>
          <LinearGradient
            colors={['#D4AF37', '#C5A028']}
            style={styles.timeContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="time" size={18} color="#1A1A1A" />
            <Text style={styles.time}>{estimatedTime} min</Text>
          </LinearGradient>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverDetails}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.driverImage}
              />
              <View style={styles.driverText}>
                <Text style={styles.driverName}>Michael Chen</Text>
                <Text style={styles.carInfo}>Mercedes S-Class</Text>
                <Text style={styles.licensePlate}>ABC 1234</Text>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#D4AF37" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#1A1A1A', '#2A2A2A']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="call" size={24} color="#D4AF37" />
              <Text style={styles.actionText}>Call</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#1A1A1A', '#2A2A2A']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="chatbubble" size={24} color="#D4AF37" />
              <Text style={styles.actionText}>Message</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#1A1A1A', '#2A2A2A']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="shield" size={24} color="#D4AF37" />
              <Text style={styles.actionText}>Safety</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webMapContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
  },
  driverMarker: {
    backgroundColor: '#D4AF37',
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  driverDot: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  destinationMarker: {
    width: 16,
    height: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  rideInfo: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 28,
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.3,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  time: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  driverCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  driverText: {
    justifyContent: 'center',
    flex: 1,
  },
  driverName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  carInfo: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  licensePlate: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#999',
    letterSpacing: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  actionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#D4AF37',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
});