// components/LocationAutocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Text, Keyboard } from 'react-native';
import { MapPin } from 'lucide-react-native';
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
      const response = await axios.get('https://loxuryabackend-1.onrender.com/ride/api/suggestions', {
        params: { query: text },
        timeout: 8000
      });
      
      let suggestionsData = [];
      
      if (Array.isArray(response.data)) {
        suggestionsData = response.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          place_id: item.id
        }));
      } 
      else if (Array.isArray(response.data.data)) {
        suggestionsData = response.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          place_id: item.id
        }));
      }
      else if (Array.isArray(response.data.suggestions)) {
        suggestionsData = response.data.suggestions;
      }
      else if (Array.isArray(response.data.predictions)) {
        suggestionsData = response.data.predictions.map((pred: any) => ({
          id: pred.place_id,
          name: pred.description,
          place_id: pred.place_id
        }));
      }
  
      setSuggestions(suggestionsData);
  
      if (suggestionsData.length === 0) {
        console.warn('[Autocomplete] No valid suggestions found in response');
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
      const response = await axios.get('https://loxuryabackend-1.onrender.com/ride/api/place-details', {
        params: { place_id: placeId },
        timeout: 8000
      });

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
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#D4AF37" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={handleChange}
          placeholderTextColor="#666"
          testID="location-autocomplete-input"
          clearButtonMode="while-editing"
        />
        {loading && <ActivityIndicator size="small" color="#D4AF37" testID="loading-indicator" />}
      </View>
      
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
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
    margin: 0,
    height: 44,
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 3,
    marginTop: 4,
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