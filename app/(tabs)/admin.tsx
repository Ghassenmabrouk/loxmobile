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

export default function AdminScreen() {
  const [drivers, setDrivers] = useState<Array<FirebaseUser & { id: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddDriver(true)}
        >
          <Ionicons name="person-add" size={20} color="#1a1a1a" />
          <Text style={styles.addButtonText}>Add Driver</Text>
        </TouchableOpacity>
      </View>

      {loading && !showAddDriver ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
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
});
