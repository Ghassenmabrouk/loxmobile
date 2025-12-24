// components/LocationAutocomplete.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, Text, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Suggestion {
  id: string;
  name: string;
  place_id: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface LocationAutocompleteProps {
  onSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder: string;
}

const LUXURY_LOCATIONS: Suggestion[] = [
  {
    id: '1',
    name: 'Four Seasons Hotel, 57 E 57th St, New York, NY 10022',
    place_id: '1',
    latitude: 40.7614,
    longitude: -73.9776,
    type: 'hotel',
  },
  {
    id: '2',
    name: 'The Ritz-Carlton, 50 Central Park S, New York, NY 10019',
    place_id: '2',
    latitude: 40.7649,
    longitude: -73.9794,
    type: 'hotel',
  },
  {
    id: '3',
    name: 'The Plaza Hotel, 768 5th Ave, New York, NY 10019',
    place_id: '3',
    latitude: 40.7643,
    longitude: -73.9744,
    type: 'hotel',
  },
  {
    id: '4',
    name: 'Mandarin Oriental, 80 Columbus Cir, New York, NY 10023',
    place_id: '4',
    latitude: 40.7688,
    longitude: -73.9830,
    type: 'hotel',
  },
  {
    id: '5',
    name: 'The St. Regis, 2 E 55th St, New York, NY 10022',
    place_id: '5',
    latitude: 40.7617,
    longitude: -73.9743,
    type: 'hotel',
  },
  {
    id: '6',
    name: 'JFK International Airport, Queens, NY 11430',
    place_id: '6',
    latitude: 40.6413,
    longitude: -73.7781,
    type: 'airport',
  },
  {
    id: '7',
    name: 'LaGuardia Airport, East Elmhurst, NY 11371',
    place_id: '7',
    latitude: 40.7769,
    longitude: -73.8740,
    type: 'airport',
  },
  {
    id: '8',
    name: 'Teterboro Airport, 111 Industrial Ave, Teterboro, NJ 07608',
    place_id: '8',
    latitude: 40.8501,
    longitude: -74.0608,
    type: 'airport',
  },
  {
    id: '9',
    name: 'Le Bernardin, 155 W 51st St, New York, NY 10019',
    place_id: '9',
    latitude: 40.7615,
    longitude: -73.9821,
    type: 'restaurant',
  },
  {
    id: '10',
    name: 'Eleven Madison Park, 11 Madison Ave, New York, NY 10010',
    place_id: '10',
    latitude: 40.7425,
    longitude: -73.9871,
    type: 'restaurant',
  },
  {
    id: '11',
    name: 'Per Se, 10 Columbus Circle, New York, NY 10019',
    place_id: '11',
    latitude: 40.7685,
    longitude: -73.9830,
    type: 'restaurant',
  },
  {
    id: '12',
    name: 'Central Park West, New York, NY 10024',
    place_id: '12',
    latitude: 40.7812,
    longitude: -73.9665,
    type: 'landmark',
  },
  {
    id: '13',
    name: 'Fifth Avenue, New York, NY 10022',
    place_id: '13',
    latitude: 40.7589,
    longitude: -73.9731,
    type: 'landmark',
  },
  {
    id: '14',
    name: 'Madison Square Garden, 4 Pennsylvania Plaza, New York, NY 10001',
    place_id: '14',
    latitude: 40.7505,
    longitude: -73.9934,
    type: 'venue',
  },
  {
    id: '15',
    name: 'Lincoln Center, 10 Lincoln Center Plaza, New York, NY 10023',
    place_id: '15',
    latitude: 40.7722,
    longitude: -73.9843,
    type: 'venue',
  },
  {
    id: '16',
    name: 'Brooklyn Bridge, New York, NY 10038',
    place_id: '16',
    latitude: 40.7061,
    longitude: -73.9969,
    type: 'landmark',
  },
  {
    id: '17',
    name: 'Times Square, Manhattan, NY 10036',
    place_id: '17',
    latitude: 40.7580,
    longitude: -73.9855,
    type: 'landmark',
  },
  {
    id: '18',
    name: 'Empire State Building, 350 5th Ave, New York, NY 10118',
    place_id: '18',
    latitude: 40.7484,
    longitude: -73.9857,
    type: 'landmark',
  },
];

const LocationAutocomplete = ({ onSelect, placeholder }: LocationAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = LUXURY_LOCATIONS.filter((location) =>
        location.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleChange = (text: string) => {
    setQuery(text);
  };

  const handleSelect = (suggestion: Suggestion) => {
    Keyboard.dismiss();
    setQuery(suggestion.name);
    setSuggestions([]);

    onSelect(suggestion.name, {
      lat: suggestion.latitude,
      lng: suggestion.longitude,
    });
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
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={handleChange}
        placeholderTextColor="#999"
        testID="location-autocomplete-input"
        clearButtonMode="while-editing"
      />

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
              testID={`suggestion-item-${item.id}`}
            >
              <View style={styles.suggestionIconContainer}>
                <Ionicons name={getLocationIcon(item.type)} size={18} color="#D4AF37" />
              </View>
              <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.suggestionType}>{item.type.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
          testID="suggestions-list"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  suggestionsList: {
    position: 'absolute',
    top: 60,
    left: -12,
    right: -12,
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 9999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#1a1a1a',
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

export default LocationAutocomplete;