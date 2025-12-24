import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationSuggestion {
  address: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface FakeLocationAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (location: LocationSuggestion) => void;
  placeholder?: string;
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
    address: 'Mandarin Oriental, 80 Columbus Cir, New York, NY 10023',
    latitude: 40.7688,
    longitude: -73.9830,
    type: 'hotel',
  },
  {
    address: 'The St. Regis, 2 E 55th St, New York, NY 10022',
    latitude: 40.7617,
    longitude: -73.9743,
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
    address: 'Teterboro Airport, 111 Industrial Ave, Teterboro, NJ 07608',
    latitude: 40.8501,
    longitude: -74.0608,
    type: 'airport',
  },
  {
    address: 'Le Bernardin, 155 W 51st St, New York, NY 10019',
    latitude: 40.7615,
    longitude: -73.9821,
    type: 'restaurant',
  },
  {
    address: 'Eleven Madison Park, 11 Madison Ave, New York, NY 10010',
    latitude: 40.7425,
    longitude: -73.9871,
    type: 'restaurant',
  },
  {
    address: 'Per Se, 10 Columbus Circle, New York, NY 10019',
    latitude: 40.7685,
    longitude: -73.9830,
    type: 'restaurant',
  },
  {
    address: 'Central Park West, New York, NY 10024',
    latitude: 40.7812,
    longitude: -73.9665,
    type: 'landmark',
  },
  {
    address: 'Fifth Avenue, New York, NY 10022',
    latitude: 40.7589,
    longitude: -73.9731,
    type: 'landmark',
  },
  {
    address: 'Madison Square Garden, 4 Pennsylvania Plaza, New York, NY 10001',
    latitude: 40.7505,
    longitude: -73.9934,
    type: 'venue',
  },
  {
    address: 'Lincoln Center, 10 Lincoln Center Plaza, New York, NY 10023',
    latitude: 40.7722,
    longitude: -73.9843,
    type: 'venue',
  },
  {
    address: 'Brooklyn Bridge, New York, NY 10038',
    latitude: 40.7061,
    longitude: -73.9969,
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

export default function FakeLocationAutocomplete({
  value,
  onChangeText,
  onSelectLocation,
  placeholder = 'Search luxury locations',
}: FakeLocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value.trim().length > 0) {
      const filtered = LUXURY_LOCATIONS.filter((location) =>
        location.address.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions(LUXURY_LOCATIONS.slice(0, 8));
      setShowSuggestions(false);
    }
  }, [value]);

  const handleSelectLocation = (location: LocationSuggestion) => {
    onChangeText(location.address);
    onSelectLocation(location);
    setShowSuggestions(false);
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'bed';
      case 'airport':
        return 'airplane';
      case 'restaurant':
        return 'restaurant';
      case 'venue':
        return 'business';
      case 'landmark':
        return 'location';
      default:
        return 'location';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onFocus={() => setShowSuggestions(true)}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              setShowSuggestions(false);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {suggestions.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSelectLocation(location)}
              >
                <View style={styles.suggestionIconContainer}>
                  <Ionicons name={getLocationIcon(location.type)} size={18} color="#D4AF37" />
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {location.address}
                  </Text>
                  <Text style={styles.suggestionType}>{location.type.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionType: {
    fontSize: 11,
    color: '#D4AF37',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
