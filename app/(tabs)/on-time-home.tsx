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
        colors={['#000000', '#1a1a1a', '#0d0d0d']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ON TIME</Text>
            <View style={styles.logoUnderline} />
            <Text style={styles.tagline}>LUXURY MOBILITY SERVICES</Text>

            <View style={styles.userCard}>
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>YOUR EXCLUSIVE CODE</Text>
                <Text style={styles.code}>{anonymousCode || 'LOADING...'}</Text>
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
            <Text style={styles.sectionTitle}>SELECT YOUR SERVICE</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/mission-booking?type=person')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1a1a1a', '#2a2a2a']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonBorder}>
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>🚗</Text>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Personal Transfer</Text>
                      <Text style={styles.buttonSubtitle}>
                        Discreet, professional chauffeur service
                      </Text>
                    </View>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/mission-booking?type=document')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1a1a1a', '#2a2a2a']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonBorder}>
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>📄</Text>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Document Delivery</Text>
                      <Text style={styles.buttonSubtitle}>
                        Secure courier with legal certification
                      </Text>
                    </View>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/mission-tracking')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1a1a1a', '#2a2a2a']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonBorder}>
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>📍</Text>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Track Service</Text>
                      <Text style={styles.buttonSubtitle}>
                        Real-time location and status updates
                      </Text>
                    </View>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/mission-history')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1a1a1a', '#2a2a2a']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonBorder}>
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>📋</Text>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Service History</Text>
                      <Text style={styles.buttonSubtitle}>
                        View past bookings and reports
                      </Text>
                    </View>
                    <Text style={styles.buttonArrow}>→</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>SECURITY LEVELS</Text>
            <View style={styles.securityGrid}>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🟢</Text>
                <Text style={styles.securityItemLabel}>Standard</Text>
                <Text style={styles.securityItemDescription}>Professional service</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🔵</Text>
                <Text style={styles.securityItemLabel}>Discreet</Text>
                <Text style={styles.securityItemDescription}>Enhanced privacy</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🟠</Text>
                <Text style={styles.securityItemLabel}>Confidential</Text>
                <Text style={styles.securityItemDescription}>High security</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityItemIcon}>🔴</Text>
                <Text style={styles.securityItemLabel}>Critical</Text>
                <Text style={styles.securityItemDescription}>Maximum protection</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>24/7 CONCIERGE SUPPORT</Text>
            <Text style={styles.footerSubtext}>We're here whenever you need us</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  logoUnderline: {
    width: 100,
    height: 2,
    backgroundColor: '#D4AF37',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 40,
  },
  userCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  codeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 8,
    letterSpacing: 2,
    fontWeight: '600',
  },
  code: {
    fontSize: 32,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 4,
  },
  clearanceContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  clearanceIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  clearanceText: {
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 2,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 28,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 24,
    letterSpacing: 2,
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    borderRadius: 16,
  },
  buttonBorder: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  buttonIcon: {
    fontSize: 36,
    marginRight: 20,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 18,
  },
  buttonArrow: {
    fontSize: 28,
    color: '#D4AF37',
    marginLeft: 12,
    fontWeight: '300',
  },
  infoSection: {
    paddingHorizontal: 28,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 20,
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '700',
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  securityItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  securityItemIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  securityItemLabel: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  securityItemDescription: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666666',
    letterSpacing: 1,
  },
});
