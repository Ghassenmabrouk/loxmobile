import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LuxuryMapPlaceholder from '@/components/LuxuryMapPlaceholder';
import { MapPin, Search, X } from 'lucide-react-native';

interface LocationSuggestion {
  address: string;
  latitude: number;
  longitude: number;
  type: string;
}

const LUXURY_LOCATIONS: LocationSuggestion[] = [
  {
    address: 'Four Seasons Hotel, 57 E 57th St, New York, NY 10022',
    latitude: 40.7614,
    longitude: -73.9776,
    type: 'hotel',
  },
  {
    address: 'The Ritz-Carlton, 50 Central Park S, New York, NY 10019',
    latitude: 40.7649,
    longitude: -73.9794,
    type: 'hotel',
  },
  {
    address: 'The Plaza Hotel, 768 5th Ave, New York, NY 10019',
    latitude: 40.7643,
    longitude: -73.9744,
    type: 'hotel',
  },
  {
    address: 'JFK International Airport, Queens, NY 11430',
    latitude: 40.6413,
    longitude: -73.7781,
    type: 'airport',
  },
  {
    address: 'LaGuardia Airport, East Elmhurst, NY 11371',
    latitude: 40.7769,
    longitude: -73.8740,
    type: 'airport',
  },
  {
    address: 'Central Park West, New York, NY 10024',
    latitude: 40.7812,
    longitude: -73.9665,
    type: 'landmark',
  },
  {
    address: 'Times Square, Manhattan, NY 10036',
    latitude: 40.7580,
    longitude: -73.9855,
    type: 'landmark',
  },
  {
    address: 'Empire State Building, 350 5th Ave, New York, NY 10118',
    latitude: 40.7484,
    longitude: -73.9857,
    type: 'landmark',
  },
];

export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fieldType = params.field as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>(LUXURY_LOCATIONS.slice(0, 5));
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7580, lng: -73.9855 });

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = LUXURY_LOCATIONS.filter((location) =>
        location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions(LUXURY_LOCATIONS.slice(0, 5));
    }
  }, [searchQuery]);

  function handleSelectLocation(location: LocationSuggestion) {
    setSelectedLocation(location);
    setMapCenter({ lat: location.latitude, lng: location.longitude });
  }

  function handleConfirmLocation() {
    if (selectedLocation) {
      if (Platform.OS === 'web') {
        const data = {
          address: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        };
        window.localStorage.setItem('selectedLocation', JSON.stringify(data));
        window.localStorage.setItem('locationField', fieldType);
      }
      router.back();
    }
  }

  const getLocationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      hotel: '🏨',
      airport: '✈️',
      restaurant: '🍽️',
      venue: '🏢',
      landmark: '📍',
    };
    return iconMap[type] || '📍';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#0d0d0d']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Select Location</Text>
            <Text style={styles.headerSubtitle}>
              {fieldType === 'pickup' ? 'Pickup location' : 'Destination'}
            </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search color="#666" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="#666" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.mapContainer}>
          <LuxuryMapPlaceholder
            center={mapCenter}
            zoom={13}
            markers={selectedLocation ? [
              {
                lat: selectedLocation.latitude,
                lng: selectedLocation.longitude,
                label: selectedLocation.address,
              }
            ] : []}
          />
        </View>

        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>SUGGESTED LOCATIONS</Text>
          <ScrollView
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionItem,
                  selectedLocation?.address === location.address && styles.suggestionItemSelected,
                ]}
                onPress={() => handleSelectLocation(location)}
              >
                <View style={styles.suggestionIconContainer}>
                  <Text style={styles.suggestionIcon}>{getLocationIcon(location.type)}</Text>
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionAddress} numberOfLines={2}>
                    {location.address}
                  </Text>
                  <Text style={styles.suggestionType}>{location.type.toUpperCase()}</Text>
                </View>
                {selectedLocation?.address === location.address && (
                  <View style={styles.selectedIndicator}>
                    <MapPin color="#D4AF37" size={20} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedLocation && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmLocation}
            >
              <LinearGradient
                colors={['#D4AF37', '#C19A2E']}
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
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
    color: '#999',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    letterSpacing: 2,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionItemSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionType: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 1,
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
  },
});
