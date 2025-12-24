import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/app/services/adminService';
import { FirebaseUser } from '@/app/types/firebase';
import { createMultipleTestRides } from '@/app/services/testDataService';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/services/firebase';
import { useAuth } from '@/hooks/useAuth';

interface Ride {
  id: string;
  name: string;
  userId: string;
  pickupLocation: {
    coordinates: string;
    locationName: string;
  };
  destinations: Array<{
    location: string;
    destinationName: string;
  }>;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  carMake: string;
  estimatedPrice: string;
  status: string;
  contact?: string;
  driverDetails?: {
    idCard: string;
    name: string;
  };
}

export default function AdminScreen() {
  const { user, userData } = useAuth();
  const [drivers, setDrivers] = useState<Array<FirebaseUser & { id: string }>>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'drivers' | 'rides'>('drivers');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    const ridesRef = collection(db, 'rides');
    const ridesQuery = query(ridesRef);

    const unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
      const ridesList: Ride[] = [];
      snapshot.forEach((doc) => {
        ridesList.push({
          id: doc.id,
          ...doc.data()
        } as Ride);
      });

      ridesList.sort((a, b) => {
        const statusOrder = { pending: 0, accepted: 1, 'in-progress': 2, completed: 3, cancelled: 4 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99);
      });

      setRides(ridesList);
    });

    return () => unsubscribe();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const driversList = await adminService.getAllDrivers();
      setDrivers(driversList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    if (!email || !password || !firstName || !lastName || !phoneNumber || !licenseNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await adminService.createDriver(
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        licenseNumber,
        vehicleModel,
        vehiclePlate
      );

      Alert.alert('Success', 'Driver added successfully');
      clearForm();
      setShowAddDriver(false);
      loadDrivers();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add driver');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setLicenseNumber('');
    setVehicleModel('');
    setVehiclePlate('');
  };

  const handleStatusToggle = async (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    try {
      await adminService.updateDriverStatus(driverId, newStatus as 'online' | 'offline' | 'busy');
      loadDrivers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update driver status');
    }
  };

  const handleCreateTestRides = async () => {
    try {
      setLoading(true);
      const results = await createMultipleTestRides(3);
      const successCount = results.filter(r => r.success).length;
      Alert.alert('Success', `Created ${successCount} test ride(s) successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create test rides');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    Alert.alert(
      'Delete Ride',
      'Are you sure you want to delete this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Attempting to delete ride:', rideId);
              console.log('Current user:', user?.uid);
              console.log('User role:', userData?.role);

              await deleteDoc(doc(db, 'rides', rideId));
              console.log('Ride deleted successfully');
            } catch (error: any) {
              console.error('Failed to delete ride:', error);
              console.error('Error code:', error.code);
              console.error('Error message:', error.message);

              let errorMessage = 'Failed to delete ride';
              if (error.code === 'permission-denied') {
                errorMessage = 'You do not have permission to delete this ride. Make sure you are logged in as an admin.';
              } else if (error.message) {
                errorMessage = error.message;
              }

              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA726';
      case 'accepted':
        return '#42A5F5';
      case 'in-progress':
        return '#66BB6A';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#EF5350';
      default:
        return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleCreateTestRides}
          >
            <Ionicons name="car-sport" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddDriver(true)}
          >
            <Ionicons name="person-add" size={20} color="#1a1a1a" />
            <Text style={styles.addButtonText}>Add Driver</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'drivers' && styles.tabActive]}
          onPress={() => setSelectedTab('drivers')}
        >
          <Ionicons name="people" size={20} color={selectedTab === 'drivers' ? '#D4AF37' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'drivers' && styles.tabTextActive]}>Drivers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'rides' && styles.tabActive]}
          onPress={() => setSelectedTab('rides')}
        >
          <Ionicons name="car" size={20} color={selectedTab === 'rides' ? '#D4AF37' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'rides' && styles.tabTextActive]}>Rides</Text>
        </TouchableOpacity>
      </View>

      {loading && !showAddDriver ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {selectedTab === 'drivers' ? (
            <>
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={24} color="#D4AF37" />
                  <Text style={styles.statNumber}>{drivers.length}</Text>
                  <Text style={styles.statLabel}>Total Drivers</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="car" size={24} color="#4CAF50" />
                  <Text style={styles.statNumber}>
                    {drivers.filter(d => d.driverStatus === 'online').length}
                  </Text>
                  <Text style={styles.statLabel}>Online</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Drivers</Text>
              {drivers.map((driver) => (
                <View key={driver.id} style={styles.driverCard}>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>
                      {driver.firstName} {driver.lastName}
                    </Text>
                    <Text style={styles.driverDetail}>{driver.email}</Text>
                    <Text style={styles.driverDetail}>{driver.phoneNumber}</Text>
                    {driver.vehicleModel && (
                      <Text style={styles.driverDetail}>
                        {driver.vehicleModel} - {driver.vehiclePlate}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      driver.driverStatus === 'online' && styles.statusOnline
                    ]}
                    onPress={() => handleStatusToggle(driver.id, driver.driverStatus || 'offline')}
                  >
                    <Text style={styles.statusText}>
                      {driver.driverStatus === 'online' ? 'Online' : 'Offline'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={24} color="#FFA726" />
                  <Text style={styles.statNumber}>
                    {rides.filter(r => r.status === 'pending').length}
                  </Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#42A5F5" />
                  <Text style={styles.statNumber}>
                    {rides.filter(r => r.status === 'accepted').length}
                  </Text>
                  <Text style={styles.statLabel}>Accepted</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="car" size={24} color="#66BB6A" />
                  <Text style={styles.statNumber}>
                    {rides.filter(r => r.status === 'in-progress').length}
                  </Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>All Rides</Text>
              {rides.length > 0 ? (
                rides.map((ride) => (
                  <View key={ride.id} style={styles.rideCard}>
                    <View style={styles.rideHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                        <Text style={styles.statusBadgeText}>
                          {ride.status.toUpperCase()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteRide(ride.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF5350" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.rideBody}>
                      <View style={styles.rideRow}>
                        <Ionicons name="person" size={16} color="#D4AF37" />
                        <Text style={styles.rideText}>{ride.name}</Text>
                        <Text style={styles.rideTextSecondary}>({ride.passengers} pax)</Text>
                      </View>

                      {ride.driverDetails && (
                        <View style={styles.rideRow}>
                          <Ionicons name="car" size={16} color="#4CAF50" />
                          <Text style={styles.rideText}>Driver: {ride.driverDetails.name}</Text>
                        </View>
                      )}

                      <View style={styles.locationSection}>
                        <View style={styles.locationRow}>
                          <View style={styles.locationDot} />
                          <Text style={styles.locationText} numberOfLines={1}>
                            {ride.pickupLocation?.locationName || 'Unknown'}
                          </Text>
                        </View>
                        <View style={styles.locationLine} />
                        <View style={styles.locationRow}>
                          <View style={[styles.locationDot, styles.locationDotDestination]} />
                          <Text style={styles.locationText} numberOfLines={1}>
                            {ride.destinations?.[0]?.destinationName || 'Unknown'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.rideDetailsRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar-outline" size={14} color="#666" />
                          <Text style={styles.detailText}>{ride.pickupDate}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={14} color="#666" />
                          <Text style={styles.detailText}>{ride.pickupTime}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="cash-outline" size={14} color="#666" />
                          <Text style={styles.detailText}>${ride.estimatedPrice}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="car-outline" size={64} color="#666" />
                  <Text style={styles.emptyText}>No rides yet</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showAddDriver}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddDriver(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Driver</Text>
              <TouchableOpacity onPress={() => setShowAddDriver(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="driver@example.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                placeholderTextColor="#666"
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor="#666"
                value={lastName}
                onChangeText={setLastName}
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                placeholderTextColor="#666"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>License Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="DL123456"
                placeholderTextColor="#666"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
              />

              <Text style={styles.inputLabel}>Vehicle Model</Text>
              <TextInput
                style={styles.input}
                placeholder="Mercedes S-Class"
                placeholderTextColor="#666"
                value={vehicleModel}
                onChangeText={setVehicleModel}
              />

              <Text style={styles.inputLabel}>Vehicle Plate</Text>
              <TextInput
                style={styles.input}
                placeholder="ABC-1234"
                placeholderTextColor="#666"
                value={vehiclePlate}
                onChangeText={setVehiclePlate}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddDriver}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Driver</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 28,
    color: '#D4AF37',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  testButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1a1a1a',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#1a1a1a',
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#D4AF37',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  driverCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  driverDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  statusButton: {
    backgroundColor: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontFamily: 'Playfair-Bold',
    fontSize: 24,
    color: '#D4AF37',
  },
  formContainer: {
    padding: 20,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#1a1a1a',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  rideCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 8,
  },
  rideBody: {
    padding: 16,
  },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  rideText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  rideTextSecondary: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#999',
  },
  locationSection: {
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  locationDotDestination: {
    backgroundColor: '#D4AF37',
  },
  locationLine: {
    width: 2,
    height: 16,
    backgroundColor: '#444',
    marginLeft: 4,
    marginVertical: 2,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#ccc',
    flex: 1,
  },
  rideDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
