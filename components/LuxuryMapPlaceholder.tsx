import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface LuxuryMapPlaceholderProps {
  pickupLocation?: string;
  destination?: string;
  eta?: string;
  driverLocation?: { lat: number; lng: number };
}

export default function LuxuryMapPlaceholder({
  pickupLocation = 'Current Location',
  destination = 'Destination',
  eta = '12 min',
  driverLocation,
}: LuxuryMapPlaceholderProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A', '#2A2A2A']}
        style={styles.mapBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.routeContainer}>
          <View style={styles.locationMarker}>
            <View style={styles.markerDot} />
            <View style={styles.pulseOuter} />
          </View>

          <View style={styles.routeLine}>
            <View style={styles.dottedLine} />
            {driverLocation && (
              <View style={styles.driverIcon}>
                <Ionicons name="car" size={20} color="#D4AF37" />
              </View>
            )}
          </View>

          <View style={[styles.locationMarker, styles.destinationMarker]}>
            <Ionicons name="flag" size={16} color="#1A1A1A" />
          </View>
        </View>

        <View style={styles.etaBadge}>
          <LinearGradient
            colors={['#D4AF37', '#C5A028']}
            style={styles.etaBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="time" size={16} color="#1A1A1A" />
            <Text style={styles.etaText}>{eta} away</Text>
          </LinearGradient>
        </View>

        <View style={styles.infoPanel}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color="#4CAF50" />
            <Text style={styles.infoText} numberOfLines={1}>
              {pickupLocation}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="flag" size={18} color="#D4AF37" />
            <Text style={styles.infoText} numberOfLines={1}>
              {destination}
            </Text>
          </View>
        </View>

        <View style={styles.gridOverlay}>
          {[...Array(5)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, { top: `${i * 25}%` }]} />
          ))}
          {[...Array(5)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineVertical, { left: `${i * 25}%` }]} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  mapBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#D4AF37',
    height: 1,
    width: '100%',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  routeContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 180,
    zIndex: 2,
  },
  locationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  pulseOuter: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    opacity: 0.2,
  },
  destinationMarker: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
  },
  routeLine: {
    width: 3,
    height: 100,
    backgroundColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dottedLine: {
    position: 'absolute',
    width: 3,
    height: '100%',
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  driverIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  etaBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  etaBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginVertical: 8,
  },
});
