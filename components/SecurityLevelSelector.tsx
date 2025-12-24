import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllSecurityLevels } from '@/app/services/securityLevelService';
import { SecurityLevel } from '@/app/types/mission';

interface SecurityLevelSelectorProps {
  selectedLevel: SecurityLevel;
  onSelectLevel: (level: SecurityLevel) => void;
  userClearance?: SecurityLevel;
}

export default function SecurityLevelSelector({
  selectedLevel,
  onSelectLevel,
  userClearance = 'critical',
}: SecurityLevelSelectorProps) {
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    loadSecurityLevels();
  }, []);

  async function loadSecurityLevels() {
    const allLevels = await getAllSecurityLevels();
    setLevels(allLevels);
  }

  function isLevelAvailable(level: SecurityLevel): boolean {
    const hierarchy: SecurityLevel[] = ['standard', 'discreet', 'confidential', 'critical'];
    const userIndex = hierarchy.indexOf(userClearance);
    const levelIndex = hierarchy.indexOf(level);
    return levelIndex <= userIndex;
  }

  const gradients: Record<SecurityLevel, string[]> = {
    standard: ['#11998e', '#38ef7d'],
    discreet: ['#4facfe', '#00f2fe'],
    confidential: ['#fa709a', '#fee140'],
    critical: ['#f093fb', '#f5576c'],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Security Level</Text>
      <Text style={styles.subtitle}>
        Higher security levels include enhanced privacy and certified drivers
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {levels.map((level) => {
          const isSelected = selectedLevel === level.code;
          const isAvailable = isLevelAvailable(level.code);

          return (
            <TouchableOpacity
              key={level.code}
              onPress={() => isAvailable && onSelectLevel(level.code)}
              disabled={!isAvailable}
              activeOpacity={0.8}
              style={[
                styles.levelCard,
                !isAvailable && styles.levelCardDisabled,
              ]}
            >
              <LinearGradient
                colors={isSelected ? gradients[level.code as SecurityLevel] : ['#2a2a3e', '#1a1a2e']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}

                <Text style={styles.levelIcon}>{level.icon}</Text>
                <Text style={styles.levelName}>{level.name}</Text>
                <Text style={styles.levelDescription} numberOfLines={2}>
                  {level.description}
                </Text>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceMultiplier}>
                    ×{level.priceMultiplier}
                  </Text>
                  <Text style={styles.priceLabel}>price</Text>
                </View>

                <View style={styles.featuresContainer}>
                  {level.requiresCertification && (
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>✓</Text>
                      <Text style={styles.featureText}>Certified Driver</Text>
                    </View>
                  )}
                  {level.enhancedLogging && (
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>✓</Text>
                      <Text style={styles.featureText}>Enhanced Logging</Text>
                    </View>
                  )}
                  {level.prioritySupport && (
                    <View style={styles.feature}>
                      <Text style={styles.featureIcon}>✓</Text>
                      <Text style={styles.featureText}>Priority Support</Text>
                    </View>
                  )}
                </View>

                {!isAvailable && (
                  <View style={styles.lockedOverlay}>
                    <Text style={styles.lockedIcon}>🔒</Text>
                    <Text style={styles.lockedText}>
                      Clearance Required
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Your current clearance: <Text style={styles.infoBold}>{userClearance.toUpperCase()}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0c0',
    marginBottom: 20,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  levelCard: {
    width: 280,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  levelCardDisabled: {
    opacity: 0.5,
  },
  cardGradient: {
    padding: 24,
    minHeight: 300,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  levelIcon: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: 'center',
  },
  levelName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  priceContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  priceMultiplier: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  priceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresContainer: {
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 14,
    color: '#ffffff',
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#a0a0c0',
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: '700',
    color: '#ffffff',
  },
});
