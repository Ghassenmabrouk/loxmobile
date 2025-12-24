import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService, UserProfile, UserSettings, SavedLocation } from '@/app/services/profileService';
import PaymentMethodsModal from '@/components/PaymentMethodsModal';
import FakeLocationAutocomplete from '@/components/FakeLocationAutocomplete';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [newLocationLabel, setNewLocationLabel] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationLatitude, setNewLocationLatitude] = useState<number | undefined>();
  const [newLocationLongitude, setNewLocationLongitude] = useState<number | undefined>();

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      let userProfile = await ProfileService.getProfile(user.uid);

      if (!userProfile) {
        userProfile = await ProfileService.createProfile(
          user.uid,
          user.email || '',
          user.displayName || 'User'
        );
      }

      const userSettings = await ProfileService.getSettings(user.uid);
      const locations = await ProfileService.getSavedLocations(user.uid);

      setProfile(userProfile);
      setSettings(userSettings);
      setSavedLocations(locations);

      if (userProfile) {
        setEditName(userProfile.full_name);
        setEditPhone(userProfile.phone_number);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.uid) return;

    const updated = await ProfileService.updateProfile(user.uid, {
      full_name: editName,
      phone_number: editPhone,
    });

    if (updated) {
      setProfile(updated);
      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleUpdateSettings = async (key: keyof UserSettings, value: boolean) => {
    if (!user?.uid || !settings) return;

    const updated = await ProfileService.updateSettings(user.uid, { [key]: value });
    if (updated) {
      setSettings(updated);
    }
  };

  const handleAddLocation = async () => {
    if (!user?.uid || !newLocationLabel || !newLocationAddress) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newLocation = await ProfileService.addSavedLocation(user.uid, {
      label: newLocationLabel,
      address: newLocationAddress,
      latitude: newLocationLatitude,
      longitude: newLocationLongitude,
      is_favorite: false,
    });

    if (newLocation) {
      setSavedLocations([newLocation, ...savedLocations]);
      setNewLocationLabel('');
      setNewLocationAddress('');
      setNewLocationLatitude(undefined);
      setNewLocationLongitude(undefined);
      setShowAddLocation(false);
      Alert.alert('Success', 'Location added successfully');
    } else {
      Alert.alert('Error', 'Failed to add location');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    Alert.alert('Delete Location', 'Are you sure you want to delete this location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await ProfileService.deleteSavedLocation(locationId);
          if (success) {
            setSavedLocations(savedLocations.filter((loc) => loc.id !== locationId));
          }
        },
      },
    ]);
  };

  const handleToggleFavorite = async (location: SavedLocation) => {
    const updated = await ProfileService.updateSavedLocation(location.id, {
      is_favorite: !location.is_favorite,
    });

    if (updated) {
      setSavedLocations(
        savedLocations.map((loc) => (loc.id === location.id ? updated : loc))
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1A1A1A', '#2A2A2A']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    profile?.avatar_url ||
                    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
                }}
                style={styles.avatar}
              />
              {profile?.vip_status && (
                <LinearGradient
                  colors={['#D4AF37', '#C5A028']}
                  style={styles.vipBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="star" size={14} color="#1A1A1A" />
                  <Text style={styles.vipText}>VIP</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.name}>{profile?.full_name || 'Guest'}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setShowEditProfile(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
              <Ionicons name="pencil" size={14} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F8F8']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="car-sport" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>{profile?.total_rides || 0}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F8F8F8']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="star" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>{profile?.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F8F8F8']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="location" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>{savedLocations.length}</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </LinearGradient>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowSavedLocations(true)}>
            <LinearGradient
              colors={['#FFFFFF', '#F8F8F8']}
              style={styles.menuItemGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location" size={22} color="#D4AF37" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Saved Locations</Text>
                  <Text style={styles.menuItemSubtitle}>Manage your favorite places</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowNotifications(true)}>
            <LinearGradient
              colors={['#FFFFFF', '#F8F8F8']}
              style={styles.menuItemGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications" size={22} color="#D4AF37" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Notifications</Text>
                  <Text style={styles.menuItemSubtitle}>Configure your notifications</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPaymentMethods(true)}>
            <LinearGradient
              colors={['#FFFFFF', '#F8F8F8']}
              style={styles.menuItemGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="card" size={22} color="#D4AF37" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Payment Methods</Text>
                  <Text style={styles.menuItemSubtitle}>Manage payment options</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <LinearGradient
              colors={['#FFFFFF', '#F8F8F8']}
              style={styles.menuItemGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="help-circle" size={22} color="#D4AF37" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Help & Support</Text>
                  <Text style={styles.menuItemSubtitle}>Get assistance</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LinearGradient
            colors={['#1A1A1A', '#2A2A2A']}
            style={styles.logoutGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="log-out-outline" size={20} color="#D4AF37" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter your phone"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
              <LinearGradient
                colors={['#D4AF37', '#C5A028']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {settings && (
              <View style={styles.settingsList}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="phone-portrait" size={20} color="#D4AF37" />
                    <Text style={styles.settingLabel}>Push Notifications</Text>
                  </View>
                  <Switch
                    value={settings.push_notifications}
                    onValueChange={(value) => handleUpdateSettings('push_notifications', value)}
                    trackColor={{ false: '#E0E0E0', true: '#D4AF37' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="mail" size={20} color="#D4AF37" />
                    <Text style={styles.settingLabel}>Email Notifications</Text>
                  </View>
                  <Switch
                    value={settings.email_notifications}
                    onValueChange={(value) => handleUpdateSettings('email_notifications', value)}
                    trackColor={{ false: '#E0E0E0', true: '#D4AF37' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="chatbubble" size={20} color="#D4AF37" />
                    <Text style={styles.settingLabel}>SMS Notifications</Text>
                  </View>
                  <Switch
                    value={settings.sms_notifications}
                    onValueChange={(value) => handleUpdateSettings('sms_notifications', value)}
                    trackColor={{ false: '#E0E0E0', true: '#D4AF37' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="car" size={20} color="#D4AF37" />
                    <Text style={styles.settingLabel}>Ride Updates</Text>
                  </View>
                  <Switch
                    value={settings.ride_updates}
                    onValueChange={(value) => handleUpdateSettings('ride_updates', value)}
                    trackColor={{ false: '#E0E0E0', true: '#D4AF37' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="pricetag" size={20} color="#D4AF37" />
                    <Text style={styles.settingLabel}>Promotional Offers</Text>
                  </View>
                  <Switch
                    value={settings.promotional_offers}
                    onValueChange={(value) => handleUpdateSettings('promotional_offers', value)}
                    trackColor={{ false: '#E0E0E0', true: '#D4AF37' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Saved Locations Modal */}
      <Modal visible={showSavedLocations} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Locations</Text>
              <TouchableOpacity onPress={() => setShowSavedLocations(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addLocationButton}
              onPress={() => {
                setShowSavedLocations(false);
                setShowAddLocation(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#D4AF37" />
              <Text style={styles.addLocationText}>Add New Location</Text>
            </TouchableOpacity>

            <ScrollView style={styles.locationsList}>
              {savedLocations.map((location) => (
                <View key={location.id} style={styles.locationItem}>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => handleToggleFavorite(location)}
                  >
                    <Ionicons
                      name={location.is_favorite ? 'star' : 'star-outline'}
                      size={24}
                      color={location.is_favorite ? '#D4AF37' : '#999'}
                    />
                  </TouchableOpacity>

                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>{location.label}</Text>
                    <Text style={styles.locationAddress}>{location.address}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteLocation(location.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Location Modal */}
      <Modal visible={showAddLocation} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Location</Text>
              <TouchableOpacity onPress={() => setShowAddLocation(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Label (e.g., Home, Work)</Text>
              <TextInput
                style={styles.input}
                value={newLocationLabel}
                onChangeText={setNewLocationLabel}
                placeholder="Enter label"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <FakeLocationAutocomplete
                value={newLocationAddress}
                onChangeText={setNewLocationAddress}
                onSelectLocation={(location) => {
                  setNewLocationAddress(location.address);
                  setNewLocationLatitude(location.latitude);
                  setNewLocationLongitude(location.longitude);
                }}
                placeholder="Search luxury locations"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddLocation}>
              <LinearGradient
                colors={['#D4AF37', '#C5A028']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.saveButtonText}>Add Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      {user?.uid && (
        <PaymentMethodsModal
          visible={showPaymentMethods}
          userId={user.uid}
          onClose={() => setShowPaymentMethods(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    marginBottom: -20,
  },
  header: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#D4AF37',
  },
  vipBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  vipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#D4AF37',
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 0.3,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuItem: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 14,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#666',
    letterSpacing: 0.2,
  },
  logoutButton: {
    margin: 20,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
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
    maxHeight: '80%',
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
  formGroup: {
    marginBottom: 20,
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
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
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
  settingsList: {
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  addLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  locationsList: {
    maxHeight: 400,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.2,
  },
  deleteButton: {
    padding: 8,
  },
});
