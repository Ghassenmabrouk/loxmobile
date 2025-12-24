import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { RideService } from '@/app/services/ride';
import { NotificationService } from '@/app/services/notificationService';
import type { Ride, LuxuryCar } from '@/app/types/ride';
import LocationAutocomplete from '@/app/(tabs)/LocationAutocomplete';

const LUXURY_CARS: LuxuryCar[] = [
  {
    id: '1',
    name: 'Mercedes S-Class',
    image: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerKm: 2.5,
    eta: '5',
    category: 'Premium',
    capacity: '4 Passengers',
  },
  {
    id: '2',
    name: 'BMW 7 Series',
    image: 'https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerKm: 3,
    eta: '8',
    category: 'Luxury',
    capacity: '4 Passengers',
  },
  {
    id: '3',
    name: 'Rolls-Royce Ghost',
    image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
    pricePerKm: 5,
    eta: '12',
    category: 'Ultra',
    capacity: '4 Passengers',
  }
] as (LuxuryCar & { category?: string; capacity?: string })[];

export default function CustomerHomeScreen() {
  const { location, errorMsg } = useLocation();
  const [destination, setDestination] = useState('');
  const [selectedCar, setSelectedCar] = useState<LuxuryCar | null>(null);
  const [estimatedDistance] = useState(10);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHours, setSelectedHours] = useState(12);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('PM');
  const [activeTab, setActiveTab] = useState('overview');
  const [upcomingRide, setUpcomingRide] = useState<Ride | null>(null);
  const [totalRides, setTotalRides] = useState(0);
  const { user } = useAuth();
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [contactNumber, setContactNumber] = useState(user?.phoneNumber || '');
  const [isEditable, setIsEditable] = useState(false);


  useEffect(() => {
    const fetchRideData = async () => {
      if (!user?.uid) return;

      try {
        const rides = await RideService.getUserRides(user.uid);
        setTotalRides(rides.length);

        const upcoming = rides
          .filter((ride: Ride) => ['pending', 'confirmed', 'accepted', 'driver-arrived', 'in-progress'].includes(ride.status))
          .sort((a: Ride, b: Ride) =>
            new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime()
          )[0];

        setUpcomingRide(upcoming || null);
      } catch (error) {
        console.error('Failed to fetch rides:', error);
      }
    };

    fetchRideData();
  }, [user]);


  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = NotificationService.subscribeToRideUpdates(
      user.uid,
      (notification) => {
        NotificationService.showDriverArrivedAlert(notification);
      }
    );

    return () => unsubscribe();
  }, [user]);


  useEffect(() => {
    if (user?.phoneNumber) {
      setContactNumber(user.phoneNumber);
    }
  }, [user?.phoneNumber]);

  const calculatePrice = (car: LuxuryCar) => {
    return (car.pricePerKm * estimatedDistance).toFixed(2);
  };

  const handleDateConfirm = () => {
    const newDate = new Date(selectedDate);
    let hours = selectedHours;

    if (selectedAmPm === 'PM' && hours < 12) hours += 12;
    if (selectedAmPm === 'AM' && hours === 12) hours = 0;

    newDate.setHours(hours, selectedMinutes, 0, 0);
    setScheduledDate(newDate);
    setShowDateModal(false);
  };

  const handleTimeConfirm = () => {
    const newDate = new Date(selectedDate);
    let hours = selectedHours;

    if (selectedAmPm === 'PM' && hours < 12) hours += 12;
    if (selectedAmPm === 'AM' && hours === 12) hours = 0;

    newDate.setHours(hours, selectedMinutes, 0, 0);
    setScheduledDate(newDate);
    setShowTimeModal(false);
  };

  const handleScheduleRide = (car: LuxuryCar) => {
    setSelectedCar(car);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async () => {
    if (!selectedCar || !location?.coords || !user || !destination) {
      Alert.alert('Error', 'Please select all required information');
      return;
    }

    try {
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const rideData = {
        name: user.displayName || user.email?.split('@')[0] || 'Guest',
        userId: user.uid,
        pickupDate: formattedDate,
        pickupTime: formattedTime,
        pickupLocation: {
          coordinates: `${location.coords.latitude},${location.coords.longitude}`,
          locationName: 'Current Location'
        },
        destinations: [{
          location: destinationCoords
            ? `${destinationCoords.lat},${destinationCoords.lng}`
            : destination,
          destinationName: destination,
          stoppingTime: null
        }],
        passengers: 1,
        contact: contactNumber || user.phoneNumber || '',
        specialRequests: '',
        carMake: selectedCar.name,
        estimatedPrice: calculatePrice(selectedCar),
        status: 'pending',
        driverDetails: {
          idCard: null,
          name: null,
          car: {
            model: null,
            licensePlate: null,
            class: null
          }
        },
        favorite: false
      };

      const newRide = await RideService.createRide(rideData);
      setUpcomingRide(newRide);
      setShowScheduleModal(false);
      Alert.alert('Success', 'Ride booked successfully!');
    } catch (error) {
      console.error('Booking failed:', error);
      Alert.alert('Error', 'Failed to book ride. Please try again.');
    }
  };

  const handleTrackRide = () => {
    if (!upcomingRide) return;
    Alert.alert('Tracking', `Tracking ride #${upcomingRide.id}`);
  };

  const renderDatePickerModal = () => (
    <Modal
      visible={showDateModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDateModal(false)}
    >
      <View style={styles.dateModalOverlay}>
        <View style={styles.dateModalContent}>
          <Text style={styles.dateModalTitle}>Select Date</Text>

          <ScrollView
            style={styles.datePickerScroll}
            showsVerticalScrollIndicator={false}
          >
            {Array.from({length: 30}, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              return date;
            }).map((date) => (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.dateOption,
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear() &&
                  styles.dateOptionSelected
                ]}
                onPress={() => {
                  setSelectedDate(date);
                }}
              >
                <Text style={[
                  styles.dateOptionText,
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear() &&
                  styles.dateOptionTextSelected
                ]}>
                  {date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dateModalButtons}>
            <TouchableOpacity
              style={styles.dateModalButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.dateModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateModalButton, styles.dateModalButtonPrimary]}
              onPress={handleDateConfirm}
            >
              <Text style={[styles.dateModalButtonText, styles.dateModalButtonPrimaryText]}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTimePickerModal = () => (
    <Modal
      visible={showTimeModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTimeModal(false)}
    >
      <View style={styles.timeModalOverlay}>
        <View style={styles.timeModalContent}>
          <Text style={styles.timeModalTitle}>Select Time</Text>

          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerColumn}>
              <ScrollView
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
              >
                {Array.from({length: 12}, (_, i) => i + 1).map((hour) => (
                  <TouchableOpacity
                    key={`hour-${hour}`}
                    style={[
                      styles.timePickerItem,
                      selectedHours === hour && styles.timePickerItemSelected
                    ]}
                    onPress={() => setSelectedHours(hour)}
                  >
                    <Text style={[
                      styles.timePickerText,
                      selectedHours === hour && styles.timePickerTextSelected
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timePickerColumn}>
              <ScrollView
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
              >
                {Array.from({length: 60}, (_, i) => i).map((minute) => (
                  <TouchableOpacity
                    key={`minute-${minute}`}
                    style={[
                      styles.timePickerItem,
                      selectedMinutes === minute && styles.timePickerItemSelected
                    ]}
                    onPress={() => setSelectedMinutes(minute)}
                  >
                    <Text style={[
                      styles.timePickerText,
                      selectedMinutes === minute && styles.timePickerTextSelected
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timePickerColumn}>
              <ScrollView
                style={styles.timePickerScroll}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
              >
                {['AM', 'PM'].map((period) => (
                  <TouchableOpacity
                    key={`period-${period}`}
                    style={[
                      styles.timePickerItem,
                      selectedAmPm === period && styles.timePickerItemSelected
                    ]}
                    onPress={() => setSelectedAmPm(period)}
                  >
                    <Text style={[
                      styles.timePickerText,
                      selectedAmPm === period && styles.timePickerTextSelected
                    ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.timeModalButtons}>
            <TouchableOpacity
              style={styles.timeModalButton}
              onPress={() => setShowTimeModal(false)}
            >
              <Text style={styles.timeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeModalButton, styles.timeModalButtonPrimary]}
              onPress={handleTimeConfirm}
            >
              <Text style={[styles.timeModalButtonText, styles.timeModalButtonPrimaryText]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1A1A1A', '#2A2A2A', '#F8F8F8']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.avatar}
              />
              <View style={styles.userTextContainer}>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0] || 'Guest'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#D4AF37" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedCar(LUXURY_CARS[0]);
              setShowScheduleModal(true);
            }}
          >
            <LinearGradient
              colors={['#D4AF37', '#C5A028']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="car" size={26} color="#1A1A1A" />
              <Text style={styles.actionButtonText}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTrackRide}
            disabled={!upcomingRide}
          >
            <LinearGradient
              colors={['#1A1A1A', '#2A2A2A']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="navigate" size={26} color="#D4AF37" />
              <Text style={styles.trackButtonText}>Track Ride</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalRides}</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingRide ? 1 : 0}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        {upcomingRide && (
  <View style={styles.upcomingRideCard}>
    <Text style={styles.sectionTitle}>Your Next Ride</Text>
    <View style={styles.rideDetails}>
      <Image
        source={{ uri: LUXURY_CARS.find(c => c.name === upcomingRide.carMake)?.image || '' }}
        style={styles.upcomingCarImage}
      />
      <View style={styles.rideInfo}>
        <Text style={styles.carName}>{upcomingRide.carMake || 'Car not specified'}</Text>
        <Text style={styles.rideDate}>
          {upcomingRide.pickupDate ? new Date(upcomingRide.pickupDate).toLocaleString() : 'Date not specified'}
        </Text>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {upcomingRide.pickupLocation?.locationName || 'Current Location'}
          </Text>
        </View>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#D4AF37" />
          <Text style={styles.locationText} numberOfLines={1}>
            {upcomingRide.destinations?.[0]?.destinationName || 'Destination not specified'}
          </Text>
        </View>
      </View>
    </View>
    <TouchableOpacity
      style={styles.trackRideButton}
      onPress={handleTrackRide}
    >
      <Text style={styles.trackRideText}>Track Ride</Text>
    </TouchableOpacity>
  </View>
)}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Premium Fleet</Text>
          <Text style={styles.sectionSubtitle}>Select your luxury experience</Text>
        </View>

        {LUXURY_CARS.map((car, index) => (
          <TouchableOpacity
            key={car.id}
            style={[
              styles.luxuryCarCard,
              selectedCar?.id === car.id && styles.selectedLuxuryCard
            ]}
            onPress={() => handleScheduleRide(car)}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8F8F8']}
              style={styles.carCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              {(car as any).category && (
                <View style={styles.categoryBadge}>
                  <LinearGradient
                    colors={
                      (car as any).category === 'Ultra'
                        ? ['#D4AF37', '#C5A028']
                        : (car as any).category === 'Luxury'
                        ? ['#C0C0C0', '#A8A8A8']
                        : ['#CD7F32', '#B87333']
                    }
                    style={styles.categoryBadgeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.categoryText}>{(car as any).category}</Text>
                  </LinearGradient>
                </View>
              )}

              <Image source={{ uri: car.image }} style={styles.luxuryCarImage} />

              <View style={styles.luxuryCarInfo}>
                <View style={styles.carNameRow}>
                  <Text style={styles.luxuryCarName}>{car.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Estimated</Text>
                    <Text style={styles.luxuryPrice}>${calculatePrice(car)}</Text>
                  </View>
                </View>

                <View style={styles.carFeatures}>
                  <View style={styles.feature}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.featureText}>{car.eta} mins</Text>
                  </View>
                  <View style={styles.featureDivider} />
                  <View style={styles.feature}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.featureText}>{(car as any).capacity}</Text>
                  </View>
                  <View style={styles.featureDivider} />
                  <View style={styles.feature}>
                    <Ionicons name="star" size={16} color="#D4AF37" />
                    <Text style={styles.featureText}>4.9</Text>
                  </View>
                </View>
              </View>

              <View style={styles.selectButton}>
                <Text style={styles.selectButtonText}>Select</Text>
                <Ionicons name="arrow-forward" size={16} color="#1A1A1A" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={showScheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCar ? 'Schedule Ride' : 'Select Your Car'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowScheduleModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>

            {!selectedCar ? (
              <ScrollView style={styles.carSelectionContainer}>
                {LUXURY_CARS.map((car) => (
                  <TouchableOpacity
                    key={car.id}
                    style={styles.modalCarCard}
                    onPress={() => setSelectedCar(car)}
                  >
                    <Image source={{ uri: car.image }} style={styles.modalCarImage} />
                    <View style={styles.modalCarInfo}>
                      <Text style={styles.modalCarName}>{car.name}</Text>
                      <View style={styles.modalCarDetails}>
                        <View style={styles.detail}>
                          <Ionicons name="time" size={16} color="#666" />
                          <Text style={styles.detailText}>{car.eta} mins away</Text>
                        </View>
                        <Text style={styles.price}>${calculatePrice(car)}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.bookingFormScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.selectedCarPreview}>
                  <Image source={{ uri: selectedCar.image }} style={styles.previewCarImage} />
                  <Text style={styles.previewCarName}>{selectedCar.name}</Text>
                  <Text style={styles.previewPrice}>${calculatePrice(selectedCar)}</Text>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>PICKUP LOCATION</Text>
                  <View style={styles.compactInput}>
                    <Ionicons name="location-outline" size={18} color="#D4AF37" />
                    <Text style={styles.compactInputText} numberOfLines={1}>
                      {location
                        ? 'Current Location'
                        : errorMsg
                        ? 'Location unavailable - Click to allow'
                        : 'Getting your location...'}
                    </Text>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>DESTINATION</Text>
                  <View style={styles.compactInput}>
                    <Ionicons name="flag-outline" size={18} color="#D4AF37" />
                    <View style={styles.autocompleteWrapper}>
                      <LocationAutocomplete
                        placeholder="Where to?"
                        onSelect={(address, coordinates) => {
                          setDestination(address);
                          if (coordinates) {
                            setDestinationCoords(coordinates);
                          }
                        }}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formSection, styles.halfWidth]}>
                    <Text style={styles.sectionLabel}>DATE</Text>
                    <TouchableOpacity
                      style={styles.compactInput}
                      onPress={() => {
                        setSelectedDate(new Date(scheduledDate));
                        setShowDateModal(true);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#666" />
                      <Text style={styles.compactInputText}>
                        {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.formSection, styles.halfWidth]}>
                    <Text style={styles.sectionLabel}>TIME</Text>
                    <TouchableOpacity
                      style={styles.compactInput}
                      onPress={() => {
                        const date = new Date(scheduledDate);
                        setSelectedHours(date.getHours() % 12 || 12);
                        setSelectedMinutes(date.getMinutes());
                        setSelectedAmPm(date.getHours() >= 12 ? 'PM' : 'AM');
                        setShowTimeModal(true);
                      }}
                    >
                      <Ionicons name="time-outline" size={18} color="#666" />
                      <Text style={styles.compactInputText}>
                        {scheduledDate.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <View style={styles.labelRow}>
                    <Text style={styles.sectionLabel}>CONTACT</Text>
                    {!isEditable && (
                      <TouchableOpacity onPress={() => setIsEditable(true)}>
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {isEditable ? (
                    <View style={styles.editableContact}>
                      <TextInput
                        style={styles.compactContactInput}
                        placeholder="Phone number"
                        placeholderTextColor="#999"
                        value={contactNumber}
                        onChangeText={setContactNumber}
                        keyboardType="phone-pad"
                        autoFocus={true}
                      />
                      <View style={styles.contactActions}>
                        <TouchableOpacity
                          onPress={() => {
                            setContactNumber(user?.phoneNumber || '');
                            setIsEditable(false);
                          }}
                          style={styles.contactActionBtn}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setIsEditable(false)}
                          style={styles.contactActionBtn}
                        >
                          <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.compactInput}>
                      <Ionicons name="call-outline" size={18} color="#666" />
                      <Text style={styles.compactInputText}>
                        {contactNumber || 'Not specified'}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.luxuryConfirmButton}
                  onPress={handleConfirmSchedule}
                >
                  <Text style={styles.luxuryConfirmText}>Confirm Booking</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {renderDatePickerModal()}
      {renderTimePickerModal()}
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    marginBottom: -16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
  },
  userTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#D4AF37',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 28,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#666',
    letterSpacing: 0.3,
  },
  luxuryCarCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  selectedLuxuryCard: {
    shadowColor: '#D4AF37',
    shadowOpacity: 0.4,
  },
  carCardGradient: {
    padding: 20,
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  categoryBadgeGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  luxuryCarImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  luxuryCarInfo: {
    marginBottom: 16,
  },
  carNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  luxuryCarName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  luxuryPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  carFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  featureDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  bookingFormScroll: {
    flex: 1,
  },
  selectedCarPreview: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  previewCarImage: {
    width: 120,
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewCarName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  formSection: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editText: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
  },
  compactInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  compactInputText: {
    fontSize: 15,
    color: '#1a1a1a',
    flex: 1,
  },
  autocompleteWrapper: {
    flex: 1,
  },
  editableContact: {
    gap: 8,
  },
  compactContactInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cancelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  saveText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  luxuryConfirmButton: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  luxuryConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    marginHorizontal: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: '#1A1A1A',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    marginHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 36,
    color: '#1A1A1A',
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    letterSpacing: 0.3,
  },
  upcomingRideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  rideDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  upcomingCarImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  rideInfo: {
    flex: 1,
  },
  rideDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  trackRideButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  trackRideText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  carName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scheduleDetails: {
    alignItems: 'center',
  },


  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },

  scheduleLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  datePickerButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 20,
    color: '#D4AF37',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#1a1a1a',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '60%',
  },
  dateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerScroll: {
    maxHeight: 300,
  },
  dateOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dateOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#666',
  },
  dateOptionTextSelected: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  dateModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dateModalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  dateModalButtonPrimary: {
    backgroundColor: '#1a1a1a',
  },
  dateModalButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  dateModalButtonPrimaryText: {
    color: '#fff',
  },
  timeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeModalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  timeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 200,
    marginBottom: 20,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerScroll: {
    width: '100%',
  },
  timePickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerItemSelected: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: '80%',
  },
  timePickerText: {
    fontSize: 18,
    color: '#666',
  },
  timePickerTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeModalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  timeModalButtonPrimary: {
    backgroundColor: '#1a1a1a',
  },
  timeModalButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  timeModalButtonPrimaryText: {
    color: '#fff',
  },
  carSelectionContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  modalCarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalCarImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  modalCarInfo: {
    flex: 1,
  },
  modalCarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },

  searchIcon: {
    marginRight: 8,
  },
  autocompleteContainer: {
    flex: 1,
  },
  modalCarDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
});
