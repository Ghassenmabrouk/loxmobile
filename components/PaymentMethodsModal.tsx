import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PaymentService, PaymentMethod, CardDetails } from '@/app/services/paymentService';

interface PaymentMethodsModalProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

export default function PaymentMethodsModal({ visible, userId, onClose }: PaymentMethodsModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPaymentMethods();
    }
  }, [visible, userId]);

  const loadPaymentMethods = async () => {
    setLoading(true);
    const methods = await PaymentService.getPaymentMethods(userId);
    setPaymentMethods(methods);
    setLoading(false);
  };

  const handleAddCard = async () => {
    if (!cardNumber || !expMonth || !expYear || !cvv) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    const cardNumberClean = cardNumber.replace(/\s/g, '');
    if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
      Alert.alert('Error', 'Invalid card number');
      return;
    }

    const monthNum = parseInt(expMonth);
    const yearNum = parseInt(expYear);

    if (monthNum < 1 || monthNum > 12) {
      Alert.alert('Error', 'Invalid expiration month');
      return;
    }

    if (yearNum < new Date().getFullYear()) {
      Alert.alert('Error', 'Card is expired');
      return;
    }

    const last4 = cardNumberClean.slice(-4);
    const brand = detectCardBrand(cardNumberClean);

    const cardDetails: CardDetails = {
      brand,
      expMonth: monthNum,
      expYear: yearNum,
      last4,
    };

    const newMethod = await PaymentService.addPaymentMethod(userId, cardDetails, setAsDefault);

    if (newMethod) {
      await loadPaymentMethods();
      setShowAddCard(false);
      resetForm();
      Alert.alert('Success', 'Payment method added successfully');
    } else {
      Alert.alert('Error', 'Failed to add payment method');
    }
  };

  const detectCardBrand = (cardNumber: string): string => {
    if (cardNumber.startsWith('4')) return 'visa';
    if (cardNumber.startsWith('5')) return 'mastercard';
    if (cardNumber.startsWith('3')) return 'amex';
    if (cardNumber.startsWith('6')) return 'discover';
    return 'unknown';
  };

  const resetForm = () => {
    setCardNumber('');
    setExpMonth('');
    setExpYear('');
    setCvv('');
    setCardholderName('');
    setSetAsDefault(false);
  };

  const handleSetDefault = async (methodId: string) => {
    const success = await PaymentService.setDefaultPaymentMethod(userId, methodId);
    if (success) {
      await loadPaymentMethods();
    }
  };

  const handleDeleteCard = async (methodId: string) => {
    Alert.alert('Delete Card', 'Are you sure you want to delete this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await PaymentService.deletePaymentMethod(methodId);
          if (success) {
            await loadPaymentMethods();
            Alert.alert('Success', 'Payment method deleted');
          } else {
            Alert.alert('Error', 'Failed to delete payment method');
          }
        },
      },
    ]);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    if (cleaned.length <= 19) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Methods</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4AF37" />
            </View>
          ) : (
            <>
              {!showAddCard ? (
                <>
                  <TouchableOpacity
                    style={styles.addCardButton}
                    onPress={() => setShowAddCard(true)}
                  >
                    <Ionicons name="add-circle" size={20} color="#D4AF37" />
                    <Text style={styles.addCardText}>Add New Card</Text>
                  </TouchableOpacity>

                  <ScrollView style={styles.cardsList} showsVerticalScrollIndicator={false}>
                    {paymentMethods.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Ionicons name="card-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No payment methods added</Text>
                        <Text style={styles.emptySubtext}>Add a card to get started</Text>
                      </View>
                    ) : (
                      paymentMethods.map((method) => {
                        const isExpired = PaymentService.isCardExpired(
                          method.card.expMonth,
                          method.card.expYear
                        );

                        return (
                          <View key={method.id} style={styles.cardItem}>
                            <LinearGradient
                              colors={
                                method.isDefault
                                  ? ['#D4AF37', '#C5A028']
                                  : ['#2A2A2A', '#1A1A1A']
                              }
                              style={styles.cardGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <View style={styles.cardHeader}>
                                <View style={styles.cardBrandContainer}>
                                  <Ionicons name="card" size={24} color="#FFFFFF" />
                                  <Text style={styles.cardBrand}>
                                    {PaymentService.formatCardBrand(method.card.brand)}
                                  </Text>
                                </View>
                                {method.isDefault && (
                                  <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultText}>DEFAULT</Text>
                                  </View>
                                )}
                              </View>

                              <Text style={styles.cardNumber}>•••• •••• •••• {method.card.last4}</Text>

                              <View style={styles.cardFooter}>
                                <View>
                                  <Text style={styles.cardLabel}>Expires</Text>
                                  <Text
                                    style={[
                                      styles.cardExpiry,
                                      isExpired && styles.cardExpired,
                                    ]}
                                  >
                                    {method.card.expMonth.toString().padStart(2, '0')}/
                                    {method.card.expYear}
                                    {isExpired && ' (Expired)'}
                                  </Text>
                                </View>

                                <View style={styles.cardActions}>
                                  {!method.isDefault && (
                                    <TouchableOpacity
                                      style={styles.actionButton}
                                      onPress={() => handleSetDefault(method.id)}
                                    >
                                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                  )}
                                  <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleDeleteCard(method.id)}
                                  >
                                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </LinearGradient>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </>
              ) : (
                <ScrollView style={styles.addCardForm} showsVerticalScrollIndicator={false}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Card Number</Text>
                    <TextInput
                      style={styles.input}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      maxLength={23}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Cardholder Name</Text>
                    <TextInput
                      style={styles.input}
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      placeholder="John Doe"
                      placeholderTextColor="#999"
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, styles.formGroupHalf]}>
                      <Text style={styles.label}>Exp Month (MM)</Text>
                      <TextInput
                        style={styles.input}
                        value={expMonth}
                        onChangeText={setExpMonth}
                        placeholder="12"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>

                    <View style={[styles.formGroup, styles.formGroupHalf]}>
                      <Text style={styles.label}>Exp Year (YYYY)</Text>
                      <TextInput
                        style={styles.input}
                        value={expYear}
                        onChangeText={setExpYear}
                        placeholder="2028"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={setCvv}
                      placeholder="123"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setSetAsDefault(!setAsDefault)}
                  >
                    <Ionicons
                      name={setAsDefault ? 'checkbox' : 'square-outline'}
                      size={24}
                      color="#D4AF37"
                    />
                    <Text style={styles.checkboxLabel}>Set as default payment method</Text>
                  </TouchableOpacity>

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowAddCard(false);
                        resetForm();
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleAddCard}>
                      <LinearGradient
                        colors={['#D4AF37', '#C5A028']}
                        style={styles.saveButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.saveButtonText}>Add Card</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  cardsList: {
    maxHeight: 500,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  cardItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardExpiry: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardExpired: {
    color: '#FF5252',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardForm: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
});
