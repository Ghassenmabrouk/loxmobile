import { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NavigationMapProps {
  driverLocation: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  destinationName: string;
}

export function NavigationMap({ driverLocation, destination, destinationName }: NavigationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initializeMap = async () => {
      try {
        const mapboxgl = await import('mapbox-gl');

        mapboxgl.default.accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

        if (mapContainerRef.current && !mapRef.current) {
          mapRef.current = new mapboxgl.default.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [driverLocation.longitude, driverLocation.latitude],
            zoom: 14,
          });

          // Create custom marker elements
          const driverEl = document.createElement('div');
          driverEl.className = 'driver-marker';
          driverEl.style.width = '48px';
          driverEl.style.height = '48px';
          driverEl.style.backgroundColor = '#FFFFFF';
          driverEl.style.borderRadius = '24px';
          driverEl.style.border = '3px solid #2196F3';
          driverEl.style.display = 'flex';
          driverEl.style.alignItems = 'center';
          driverEl.style.justifyContent = 'center';
          driverEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          driverEl.innerHTML = '🚗';
          driverEl.style.fontSize = '24px';

          driverMarkerRef.current = new mapboxgl.default.Marker({ element: driverEl })
            .setLngLat([driverLocation.longitude, driverLocation.latitude])
            .addTo(mapRef.current);

          const destEl = document.createElement('div');
          destEl.className = 'destination-marker';
          destEl.style.width = '40px';
          destEl.style.height = '40px';
          destEl.style.backgroundColor = '#FFFFFF';
          destEl.style.borderRadius = '20px';
          destEl.style.border = '3px solid #D4AF37';
          destEl.style.display = 'flex';
          destEl.style.alignItems = 'center';
          destEl.style.justifyContent = 'center';
          destEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          destEl.innerHTML = '🏁';
          destEl.style.fontSize = '20px';

          destinationMarkerRef.current = new mapboxgl.default.Marker({ element: destEl })
            .setLngLat([destination.longitude, destination.latitude])
            .addTo(mapRef.current);

          // Fit bounds to show both markers
          const bounds = new mapboxgl.default.LngLatBounds();
          bounds.extend([driverLocation.longitude, driverLocation.latitude]);
          bounds.extend([destination.longitude, destination.latitude]);
          mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update driver marker position
  useEffect(() => {
    if (Platform.OS === 'web' && driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driverLocation.longitude, driverLocation.latitude]);

      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [driverLocation.longitude, driverLocation.latitude],
          duration: 1000,
        });
      }
    }
  }, [driverLocation]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.notAvailableText}>Map only available on web</Text>
      </View>
    );
  }

  return (
    <View style={styles.navigationCard}>
      <View style={styles.mapHeader}>
        <View style={styles.navigationHeaderInline}>
          <Ionicons name="navigate" size={24} color="#2196F3" />
          <Text style={styles.navigationTitleInline}>Navigation Active</Text>
        </View>
        <View style={styles.destinationInfoInline}>
          <Ionicons name="flag" size={16} color="#D4AF37" />
          <Text style={styles.destinationTextInline} numberOfLines={1}>
            {destinationName}
          </Text>
        </View>
      </View>
      <View style={styles.mapContainer}>
        <div
          ref={mapContainerRef as any}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navigationCard: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  mapHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navigationHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  navigationTitleInline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  destinationInfoInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destinationTextInline: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  mapContainer: {
    width: '100%',
    height: 400,
  },
  container: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  notAvailableText: {
    fontSize: 16,
    color: '#666',
  },
});
