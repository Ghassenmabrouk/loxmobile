import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

interface UseLocationOptions {
  continuous?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          if (options.continuous) {
            watchIdRef.current = navigator.geolocation.watchPosition(
              (position) => {
                setLocation({
                  coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude,
                    accuracy: position.coords.accuracy,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                  },
                  timestamp: position.timestamp,
                } as Location.LocationObject);
              },
              (error) => {
                setErrorMsg('Permission to access location was denied');
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          } else {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLocation({
                  coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude,
                    accuracy: position.coords.accuracy,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                  },
                  timestamp: position.timestamp,
                } as Location.LocationObject);
              },
              (error) => {
                setErrorMsg('Permission to access location was denied');
              }
            );
          }
        } else {
          setErrorMsg('Geolocation is not supported by this browser');
        }
      } else {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        if (options.continuous) {
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (newLocation) => {
              setLocation(newLocation);
            }
          );

          return () => {
            subscription.remove();
          };
        } else {
          let location = await Location.getCurrentPositionAsync({});
          setLocation(location);
        }
      }
    })();

    return () => {
      if (Platform.OS === 'web' && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [options.continuous]);

  return {
    location,
    errorMsg,
  };
}