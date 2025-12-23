import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';

let MapView: any;
let Marker: any;

if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
  Marker = require('react-native-maps').Marker;
}

const SAVED_LOCATIONS = [
  {
    id: '1',
    name: 'Home',
    address: '123 Park Avenue, New York',
    coords: { latitude: 40.7829, longitude: -73.9654 },
  },
  {
    id: '2',
    name: 'Office',
    address: '350 Fifth Avenue, New York',
    coords: { latitude: 40.7484, longitude: -73.9857 },
  },
];

export default function LocationsScreen() {
  const [selectedLocation, setSelectedLocation] = useState(SAVED_LOCATIONS[0]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
      </View>

      {Platform.OS === 'web' ? (
        <View style={[styles.map, styles.webMapPlaceholder]}>
          <Text style={styles.webMapText}>Map view is only available on mobile</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 40.7484,
            longitude: -73.9857,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          {SAVED_LOCATIONS.map((location) => (
            <Marker
              key={location.id}
              coordinate={location.coords}
              title={location.name}
              description={location.address}
            />
          ))}
        </MapView>
      )}

      <View style={styles.locationsList}>
        {SAVED_LOCATIONS.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[
              styles.locationCard,
              selectedLocation.id === location.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedLocation(location)}>
            <MapPin
              size={20}
              color={selectedLocation.id === location.id ? '#D4AF37' : '#666'}
            />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationAddress}>{location.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 32,
    color: '#1a1a1a',
  },
  map: {
    height: 300,
  },
  webMapPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
  locationsList: {
    padding: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: '#f8f8f8',
    borderColor: '#D4AF37',
    borderWidth: 1,
  },
  locationInfo: {
    marginLeft: 12,
  },
  locationName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationAddress: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
});