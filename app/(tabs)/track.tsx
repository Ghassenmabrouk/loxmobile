import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Phone, MessageSquare, Shield, Clock } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';

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
  const mapRef = useRef<MapView>(null);
  const { location } = useLocation();
  const [driverLocation, setDriverLocation] = useState(DRIVER_LOCATION);
  const [estimatedTime, setEstimatedTime] = useState('15');
  const GOOGLE_MAPS_API_KEY = 'AIzaSyAH5EZt8YgjuC_3JW292pKQciyZH_1KUVQ';

  useEffect(() => {
    // Simulate driver movement
    const interval = setInterval(() => {
      setDriverLocation(prev => ({
        latitude: prev.latitude + 0.0001,
        longitude: prev.longitude + 0.0001,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [driverLocation, DESTINATION],
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        }
      );
    }
  }, [driverLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            ...driverLocation,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}>
          {/* Driver Marker */}
          <Marker coordinate={driverLocation}>
            <View style={styles.driverMarker}>
              <View style={styles.driverDot} />
            </View>
          </Marker>

          {/* Destination Marker */}
          <Marker coordinate={DESTINATION}>
            <View style={styles.destinationMarker} />
          </Marker>

          {/* Route */}
          <MapViewDirections
            origin={driverLocation}
            destination={DESTINATION}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="#D4AF37"
            optimizeWaypoints={true}
            onReady={result => {
              setEstimatedTime(Math.ceil(result.duration).toString());
            }}
          />
        </MapView>
      </View>

      <View style={styles.rideInfo}>
        <View style={styles.header}>
          <Text style={styles.title}>Your ride is on the way</Text>
          <View style={styles.timeContainer}>
            <Clock size={20} color="#D4AF37" />
            <Text style={styles.time}>{estimatedTime} min</Text>
          </View>
        </View>

        <View style={styles.driverInfo}>
          <View style={styles.driverDetails}>
            <View style={styles.driverImagePlaceholder} />
            <View style={styles.driverText}>
              <Text style={styles.driverName}>Michael Chen</Text>
              <Text style={styles.carInfo}>Mercedes S-Class • ABC 123</Text>
            </View>
          </View>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>4.9 ★</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Phone size={24} color="#1a1a1a" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageSquare size={24} color="#1a1a1a" />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Shield size={24} color="#1a1a1a" />
            <Text style={styles.actionText}>Safety</Text>
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
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 24,
    color: '#1a1a1a',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 12,
  },
  time: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  driverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  driverText: {
    justifyContent: 'center',
  },
  driverName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  carInfo: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  rating: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 12,
  },
  ratingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1a1a1a',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  actionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1a1a1a',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#D4AF37',
  },
});