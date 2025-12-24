import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, ScrollView } from 'react-native';
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

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
  };
}

interface RouteData {
  distance: number;
  duration: number;
  steps: RouteStep[];
  geometry: any;
}

export function NavigationMap({ driverLocation, destination, destinationName }: NavigationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Fetch route from Mapbox Directions API
  const fetchRoute = async () => {
    try {
      const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.longitude},${driverLocation.latitude};${destination.longitude},${destination.latitude}?steps=true&geometries=geojson&access_token=${token}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const steps = route.legs[0].steps.map((step: any) => ({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          maneuver: {
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
          },
        }));

        setRouteData({
          distance: route.distance,
          duration: route.duration,
          steps,
          geometry: route.geometry,
        });

        return route.geometry;
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
    return null;
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initializeMap = async () => {
      try {
        const mapboxgl = await import('mapbox-gl');

        mapboxgl.default.accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';

        if (mapContainerRef.current && !mapRef.current) {
          mapRef.current = new mapboxgl.default.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/navigation-night-v1',
            center: [driverLocation.longitude, driverLocation.latitude],
            zoom: 16,
            pitch: 45,
          });

          mapRef.current.on('load', async () => {
            // Fetch and display route
            const geometry = await fetchRoute();

            if (geometry && mapRef.current) {
              // Add route layer
              mapRef.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: geometry,
                },
              });

              mapRef.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': '#2196F3',
                  'line-width': 6,
                  'line-opacity': 0.8,
                },
              });

              // Add route outline
              mapRef.current.addLayer({
                id: 'route-outline',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': '#1976D2',
                  'line-width': 8,
                  'line-opacity': 0.4,
                },
              }, 'route');
            }

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
            driverEl.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.6)';
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
            destEl.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.6)';
            destEl.innerHTML = '🏁';
            destEl.style.fontSize = '20px';

            destinationMarkerRef.current = new mapboxgl.default.Marker({ element: destEl })
              .setLngLat([destination.longitude, destination.latitude])
              .addTo(mapRef.current);

            // Fit bounds to show route
            const bounds = new mapboxgl.default.LngLatBounds();
            bounds.extend([driverLocation.longitude, driverLocation.latitude]);
            bounds.extend([destination.longitude, destination.latitude]);
            mapRef.current.fitBounds(bounds, { padding: 100, maxZoom: 16 });
          });
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

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getManeuverIcon = (type: string, modifier?: string): string => {
    if (type === 'arrive') return 'flag';
    if (type === 'depart') return 'play';
    if (type === 'turn') {
      if (modifier === 'left') return 'arrow-back';
      if (modifier === 'right') return 'arrow-forward';
      if (modifier === 'sharp left') return 'return-up-back';
      if (modifier === 'sharp right') return 'return-up-forward';
      if (modifier === 'slight left') return 'arrow-back';
      if (modifier === 'slight right') return 'arrow-forward';
    }
    if (type === 'roundabout') return 'sync';
    if (type === 'merge') return 'git-merge';
    if (type === 'continue') return 'arrow-up';
    return 'navigate';
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.notAvailableText}>Map only available on web</Text>
      </View>
    );
  }

  const currentStep = routeData?.steps[currentStepIndex];

  return (
    <View style={styles.navigationCard}>
      {/* Current Turn Instruction */}
      {currentStep && (
        <View style={styles.turnInstruction}>
          <View style={styles.turnIconContainer}>
            <Ionicons
              name={getManeuverIcon(currentStep.maneuver.type, currentStep.maneuver.modifier) as any}
              size={48}
              color="#2196F3"
            />
          </View>
          <View style={styles.turnInfo}>
            <Text style={styles.turnDistance}>{formatDistance(currentStep.distance)}</Text>
            <Text style={styles.turnText} numberOfLines={2}>
              {currentStep.instruction}
            </Text>
          </View>
        </View>
      )}

      {/* ETA and Distance Banner */}
      {routeData && (
        <View style={styles.etaBanner}>
          <View style={styles.etaItem}>
            <Ionicons name="time-outline" size={20} color="#D4AF37" />
            <Text style={styles.etaText}>{formatDuration(routeData.duration)}</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaItem}>
            <Ionicons name="location-outline" size={20} color="#D4AF37" />
            <Text style={styles.etaText}>{formatDistance(routeData.distance)}</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaItem}>
            <Ionicons name="flag-outline" size={20} color="#D4AF37" />
            <Text style={[styles.etaText, { flex: 1 }]} numberOfLines={1}>
              {destinationName}
            </Text>
          </View>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <div
          ref={mapContainerRef as any}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Upcoming Steps */}
      {routeData && routeData.steps.length > 1 && (
        <View style={styles.upcomingSteps}>
          <Text style={styles.upcomingTitle}>Upcoming Turns</Text>
          <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
            {routeData.steps.slice(currentStepIndex + 1).map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <Ionicons
                  name={getManeuverIcon(step.maneuver.type, step.maneuver.modifier) as any}
                  size={20}
                  color="#666"
                />
                <View style={styles.stepDetails}>
                  <Text style={styles.stepText} numberOfLines={1}>
                    {step.instruction}
                  </Text>
                  <Text style={styles.stepDistance}>{formatDistance(step.distance)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navigationCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  turnInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    gap: 16,
  },
  turnIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnInfo: {
    flex: 1,
  },
  turnDistance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  turnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  etaDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  mapContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#1a1a1a',
  },
  upcomingSteps: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    maxHeight: 200,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  stepsList: {
    maxHeight: 150,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  stepDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  stepDistance: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
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
