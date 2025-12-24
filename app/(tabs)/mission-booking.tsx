import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/hooks/useAuth';
import SecurityLevelSelector from '@/components/SecurityLevelSelector';
import { createMission, calculatePrice } from '@/app/services/missionService';
import { SecurityLevel, MissionType } from '@/app/types/mission';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/app/services/firebase';

export default function MissionBookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const missionType = (params.type as MissionType) || 'person';

  const [step, setStep] = useState(1);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState(0);
  const [pickupLng, setPickupLng] = useState(0);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffLat, setDropoffLat] = useState(0);
  const [dropoffLng, setDropoffLng] = useState(0);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('standard');
  const [userClearance, setUserClearance] = useState<SecurityLevel>('standard');
  const [anonymousCode, setAnonymousCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [senderOrg, setSenderOrg] = useState('');
  const [receiverOrg, setReceiverOrg] = useState('');
  const [documentType, setDocumentType] = useState<'legal' | 'medical' | 'diplomatic' | 'corporate' | 'confidential'>('legal');

  const [pricing, setPricing] = useState({ basePrice: 0, securityPremium: 0, totalPrice: 0 });

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (pickupAddress && dropoffAddress && securityLevel) {
      calculateMissionPrice();
    }
  }, [securityLevel, pickupAddress, dropoffAddress]);

  async function loadUserData() {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAnonymousCode(userData.anonymousCode || '');
        setUserClearance(userData.securityClearance || 'standard');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async function calculateMissionPrice() {
    const distance = 15;
    const duration = 30;

    const price = await calculatePrice(distance, duration, securityLevel);
    setPricing(price);
  }

  async function handleBookMission() {
    if (!user) {
      Alert.alert('Error', 'Please log in to book a mission');
      return;
    }

    if (!pickupAddress || !dropoffAddress) {
      Alert.alert('Error', 'Please enter pickup and dropoff locations');
      return;
    }

    setIsLoading(true);

    try {
      const documentDetails = missionType === 'document' ? {
        type: documentType,
        senderOrganization: senderOrg,
        receiverOrganization: receiverOrg,
        requiresLegalReport: true,
      } : undefined;

      const mission = await createMission({
        clientId: user.uid,
        clientCode: anonymousCode,
        type: missionType,
        securityLevel,
        pickup: {
          address: pickupAddress,
          coordinates: { latitude: pickupLat, longitude: pickupLng },
          timestamp: new Date(),
        },
        dropoff: {
          address: dropoffAddress,
          coordinates: { latitude: dropoffLat, longitude: dropoffLng },
          timestamp: new Date(),
        },
        scheduledFor: scheduledDate,
        estimatedDuration: 30,
        basePrice: pricing.basePrice,
        securityPremium: pricing.securityPremium,
        documentDetails,
      });

      Alert.alert(
        'Mission Created',
        `Mission ${mission.missionCode} has been created. Finding a certified driver...`,
        [
          {
            text: 'Track Mission',
            onPress: () => router.push(`/mission-tracking?missionId=${mission.missionId}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating mission:', error);
      Alert.alert('Error', 'Failed to create mission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function renderStepIndicator() {
    const totalSteps = missionType === 'document' ? 4 : 3;

    return (
      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              step > index && styles.stepDotCompleted,
              step === index + 1 && styles.stepDotActive,
            ]}
          />
        ))}
      </View>
    );
  }

  function renderLocationStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Where do you need to go?</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pickup Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pickup address"
            placeholderTextColor="#666"
            value={pickupAddress}
            onChangeText={setPickupAddress}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Dropoff Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter destination address"
            placeholderTextColor="#666"
            value={dropoffAddress}
            onChangeText={setDropoffAddress}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (!pickupAddress || !dropoffAddress) && styles.buttonDisabled]}
          onPress={() => setStep(2)}
          disabled={!pickupAddress || !dropoffAddress}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderSecurityStep() {
    return (
      <View style={styles.stepContent}>
        <SecurityLevelSelector
          selectedLevel={securityLevel}
          onSelectLevel={setSecurityLevel}
          userClearance={userClearance}
        />

        <View style={styles.priceDisplay}>
          <Text style={styles.priceLabel}>Estimated Price</Text>
          <Text style={styles.priceAmount}>€{pricing.totalPrice.toFixed(2)}</Text>
          <Text style={styles.priceBreakdown}>
            Base: €{pricing.basePrice.toFixed(2)} + Security Premium: €{pricing.securityPremium.toFixed(2)}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(1)}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStep(3)}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderDateTimeStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>When do you need this mission?</Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonLabel}>Scheduled Time</Text>
          <Text style={styles.dateButtonValue}>
            {scheduledDate.toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="datetime"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setScheduledDate(date);
            }}
            minimumDate={new Date()}
          />
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(2)}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              if (missionType === 'document') {
                setStep(4);
              } else {
                handleBookMission();
              }
            }}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {missionType === 'document' ? 'Continue' : 'Book Mission'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderDocumentDetailsStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Document Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Document Type</Text>
          <View style={styles.documentTypeGrid}>
            {['legal', 'medical', 'diplomatic', 'corporate', 'confidential'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.documentTypeButton,
                  documentType === type && styles.documentTypeButtonSelected,
                ]}
                onPress={() => setDocumentType(type as any)}
              >
                <Text
                  style={[
                    styles.documentTypeText,
                    documentType === type && styles.documentTypeTextSelected,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sender Organization</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter sender organization name"
            placeholderTextColor="#666"
            value={senderOrg}
            onChangeText={setSenderOrg}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Receiver Organization</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter receiver organization name"
            placeholderTextColor="#666"
            value={receiverOrg}
            onChangeText={setReceiverOrg}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>📋</Text>
          <Text style={styles.infoText}>
            Legal-value PDF report with chain of custody will be generated upon completion.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(3)}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, (!senderOrg || !receiverOrg) && styles.buttonDisabled]}
            onPress={handleBookMission}
            disabled={!senderOrg || !receiverOrg || isLoading}
          >
            <Text style={styles.primaryButtonText}>Book Mission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#0d0d0d']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {missionType === 'person' ? 'Person Transport' : 'Document Delivery'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {missionType === 'person' ? '🚗 Secure mobility' : '📄 Chain of custody'}
            </Text>
          </View>
        </View>

        {renderStepIndicator()}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderLocationStep()}
          {step === 2 && renderSecurityStep()}
          {step === 3 && renderDateTimeStep()}
          {step === 4 && renderDocumentDetailsStep()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0c0',
    marginTop: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotCompleted: {
    backgroundColor: '#D4AF37',
    width: 24,
  },
  stepDotActive: {
    backgroundColor: '#D4AF37',
    width: 32,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContent: {
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0c0',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  priceDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceLabel: {
    fontSize: 14,
    color: '#a0a0c0',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  priceBreakdown: {
    fontSize: 12,
    color: '#a0a0c0',
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#a0a0c0',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateButtonValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  documentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  documentTypeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  documentTypeButtonSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  documentTypeText: {
    fontSize: 14,
    color: '#a0a0c0',
    fontWeight: '500',
  },
  documentTypeTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
});
