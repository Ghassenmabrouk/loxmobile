import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/app/services/firebase';

export default function ONTimeHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [anonymousCode, setAnonymousCode] = useState('');
  const [securityClearance, setSecurityClearance] = useState('standard');

  useEffect(() => {
    loadUserData();
  }, [user]);

  async function loadUserData() {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAnonymousCode(userData.anonymousCode || '');
        setSecurityClearance(userData.securityClearance || 'standard');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  const securityIcons = {
    standard: '🟢',
    discreet: '🔵',
    confidential: '🟠',
    critical: '🔴',
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ON TIME</Text>
            <Text style={styles.tagline}>Secure Mobility Infrastructure</Text>

            <View style={styles.userCard}>
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Your Code</Text>
                <Text style={styles.code}>{anonymousCode || 'Loading...'}</Text>
              </View>
              <View style={styles.clearanceContainer}>
                <Text style={styles.clearanceIcon}>
                  {securityIcons[securityClearance as keyof typeof securityIcons]}
                </Text>
                <Text style={styles.clearanceText}>
                  {securityClearance.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>What do you need?</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/mission-booking?type=person')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2193b0', '#6dd5ed']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>🚗</Text>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Person Transport</Text>
                    <Text style={styles.buttonSubtitle}>
                      Secure, discreet mobility
                    </Text>
                  </View>
                  <Text style={styles.buttonArrow}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/mission-booking?type=document')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>📄</Text>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Document Delivery</Text>
                    <Text style={styles.buttonSubtitle}>
                      Legal-value chain of custody
                    </Text>
                  </View>
                  <Text style={styles.buttonArrow}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/mission-tracking')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>📍</Text>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Track Mission</Text>
                    <Text style={styles.buttonSubtitle}>
                      Real-time location and ETA
                    </Text>
                  </View>
                  <Text style={styles.buttonArrow}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/mission-history')}
            >
              <Text style={styles.secondaryButtonText}>Mission History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/profile')}
            >
              <Text style={styles.secondaryButtonText}>Profile Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Security Levels Available</Text>
            <View style={styles.securityGrid}>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🟢</Text>
                <Text style={styles.securityItemLabel}>Standard</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🔵</Text>
                <Text style={styles.securityItemLabel}>Discreet</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🟠</Text>
                <Text style={styles.securityItemLabel}>Confidential</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🔴</Text>
                <Text style={styles.securityItemLabel}>Critical</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#a0a0c0',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  codeContainer: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  code: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  clearanceContainer: {
    alignItems: 'center',
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearanceIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  clearanceText: {
    fontSize: 10,
    color: '#a0a0c0',
    letterSpacing: 1,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    letterSpacing: 1,
  },
  actionButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    padding: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  buttonArrow: {
    fontSize: 28,
    color: '#ffffff',
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: 14,
    color: '#a0a0c0',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  securityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '22%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  securityItemIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  securityItemLabel: {
    fontSize: 11,
    color: '#a0a0c0',
    textAlign: 'center',
  },
});
