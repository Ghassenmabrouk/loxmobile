// components/LocationAutocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Suggestion {
  id: string;
  name: string;
  place_id: string;
}

interface LocationAutocompleteProps {
  onSelect: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder: string;
}

const LocationAutocomplete = ({ onSelect, placeholder }: LocationAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async (text: string) => {
    console.log('[Autocomplete] Fetching suggestions for:', text);
    setError(null);

    setLoading(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await axios.get(
        `${supabaseUrl}/functions/v1/places-autocomplete`,
        {
          params: {
            input: text,
          },
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000
        }
      );

      if (response.data.status === 'OK' && Array.isArray(response.data.predictions)) {
        const suggestionsData = response.data.predictions.map((pred: any) => ({
          id: pred.place_id,
          name: pred.description,
          place_id: pred.place_id
        }));
        setSuggestions(suggestionsData);
      } else {
        console.warn('[Autocomplete] No predictions found');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('[Autocomplete] Error:', error);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    console.log('[Autocomplete] Fetching details for place:', placeId);
    setFetchingDetails(true);
    setError(null);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await axios.get(
        `${supabaseUrl}/functions/v1/place-details`,
        {
          params: {
            place_id: placeId,
          },
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000
        }
      );

      if (!response.data.result) {
        throw new Error('Invalid place details response');
      }

      const details = response.data.result;
      const address = details.formatted_address;
      const location = details.geometry?.location;

      if (!location) {
        throw new Error('No location data in response');
      }

      return {
        address,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        }
      };
    } catch (error) {
      console.error('[Autocomplete] Place details error:', error);
      setError('Failed to get location details');
      return null;
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    Keyboard.dismiss();
    setQuery(suggestion.name);
    setSuggestions([]);
    
    const placeDetails = await fetchPlaceDetails(suggestion.place_id);
    if (placeDetails) {
      onSelect(placeDetails.address, placeDetails.coordinates);
    } else {
      onSelect(suggestion.name);
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
      {loading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#D4AF37" testID="loading-indicator" />
        </View>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {suggestions.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
              testID={`suggestion-item-${item.id}`}
            >
              <Text style={styles.suggestionText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
          testID="suggestions-list"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        />
      )}

      {fetchingDetails && (
        <View style={styles.detailsLoading} testID="details-loading">
          <ActivityIndicator size="small" color="#D4AF37" />
          <Text style={styles.loadingText}>Getting location details...</Text>
        </View>
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
  loadingIndicator: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  suggestionsList: {
    position: 'absolute',
    top: 60,
    left: -12,
    right: -12,
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 200,
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  detailsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: 'red',
    marginTop: 4,
    fontSize: 12,
  },
});

export default LocationAutocomplete;