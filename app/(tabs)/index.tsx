// app/(tabs)/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, ChevronRight, X, DollarSign, Car, Navigation, Calendar } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { RideService } from '@/app/services/ride';
import type { Ride, LuxuryCar } from '@/app/types/ride';
import LocationAutocomplete from '@/app/(tabs)/LocationAutocomplete';

const LUXURY_CARS: LuxuryCar[] = [
  {
    id: '1',
    name: 'Mercedes S-Class',
    image: 'https://images.unsplash.com/photo-1622194993799-e8e8bf636371?auto=format&fit=crop&w=800&q=80',
    pricePerKm: 2.5,
    eta: '5'
  },
  {
    id: '2',
    name: 'BMW 7 Series',
    image: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=800&q=80',
    pricePerKm: 3,
    eta: '8'
  },
  {
    id: '3',
    name: 'Rolls-Royce Ghost',
    image: 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?auto=format&fit=crop&w=800&q=80',
    pricePerKm: 5,
    eta: '12'
  }
];

export default function HomeScreen() {
  const { location } = useLocation();
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
  const [isEditable, setIsEditable] = useState(false); // Control edit mode


  useEffect(() => {
    const fetchRideData = async () => {
      if (!user?._id) return;
      
      try {
        const rides = await RideService.getUserRides(user._id);
        setTotalRides(rides.length);
        
        // Find the most recent upcoming ride with proper typing
        const upcoming = rides
          .filter((ride: Ride) => ['pending', 'confirmed'].includes(ride.status))
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
      // Format the date and time according to schema requirements
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
  
      // Prepare the ride data according to your schema
      const rideData = {
        name: user.username || 'Guest',
        userId: user._id,
        pickupDate: formattedDate,
        pickupTime: formattedTime,
        pickupLocation: {
          coordinates: `${location.coords.latitude},${location.coords.longitude}`,
          locationName: 'Current Location'
        },
        destinations: [{
          location: destinationCoords 
            ? `${destinationCoords.lat},${destinationCoords.lng}`
            : destination, // Fallback to address if no coordinates
          destinationName: destination,
          stoppingTime: null // Can be updated later
        }],
        passengers: 1,
        contact: user.phoneNumber || '', // Add user's contact info
        specialRequests: '', // Can be added from UI if needed
        carMake: selectedCar.name,
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.greeting}>Welcome,</Text>
              <Text style={styles.name}>{user?.username || 'Guest'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              setSelectedCar(LUXURY_CARS[0]); // Select first car by default
              setShowScheduleModal(true);
            }}
          >
            <Car size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Book a Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.trackButton]}
            onPress={handleTrackRide}
            disabled={!upcomingRide}
          >
            <Navigation size={24} color="#1a1a1a" />
            <Text style={styles.trackButtonText}>Track Ride</Text>
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
          <MapPin size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {upcomingRide.pickupLocation?.locationName || 'Current Location'}
          </Text>
        </View>
        <View style={styles.locationInfo}>
          <MapPin size={16} color="#D4AF37" />
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

        <Text style={styles.sectionTitle}>Available Luxury Cars</Text>
        {LUXURY_CARS.map((car) => (
          <TouchableOpacity 
            key={car.id} 
            style={[styles.carCard, selectedCar?.id === car.id && styles.selectedCard]}
            onPress={() => handleScheduleRide(car)}
          >
            <Image source={{ uri: car.image }} style={styles.carImage} />
            <View style={styles.carInfo}>
              <Text style={styles.carName}>{car.name}</Text>
              <View style={styles.carDetails}>
                <View style={styles.detail}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.detailText}>{car.eta} mins away</Text>
                </View>
                <Text style={styles.price}>${calculatePrice(car)}</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#D4AF37" />
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
                <X size={24} color="#1a1a1a" />
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
                          <Clock size={16} color="#666" />
                          <Text style={styles.detailText}>{car.eta} mins away</Text>
                        </View>
                        <Text style={styles.price}>${calculatePrice(car)}</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#D4AF37" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <>
                <View style={styles.locationContainer}>
                  <View style={styles.searchBar}>
                    <MapPin size={20} color="#666" />
                    <Text style={styles.currentLocation}>
                      {location ? 'Current Location' : 'Locating...'}
                    </Text>
                  </View>

                  <View style={styles.searchBar}>
  <MapPin size={20} color="#D4AF37" style={styles.searchIcon} />
  <View style={styles.autocompleteContainer}>
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

                <View style={styles.scheduleDetails}>
                  <Image source={{ uri: selectedCar.image }} style={styles.modalCarImage} />
                  <Text style={styles.modalCarName}>{selectedCar.name}</Text>
                  
                  <View style={styles.scheduleRow}>
                    <View style={styles.scheduleItem}>
                      <Calendar size={20} color="#666" />
                      <Text style={styles.scheduleLabel}>Pick-up-Datee</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        setSelectedDate(new Date(scheduledDate));
                        setShowDateModal(true);
                      }}
                    >
                      <Text style={styles.dateText}>
                        {scheduledDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.scheduleRow}>
                    <View style={styles.scheduleItem}>
                      <Clock size={20} color="#666" />
                      <Text style={styles.scheduleLabel}>Pick-up-Timee</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        const date = new Date(scheduledDate);
                        setSelectedHours(date.getHours() % 12 || 12);
                        setSelectedMinutes(date.getMinutes());
                        setSelectedAmPm(date.getHours() >= 12 ? 'PM' : 'AM');
                        setShowTimeModal(true);
                      }}
                    >
                      <Text style={styles.dateText}>
                        {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </TouchableOpacity>
                  </View>
                
                 
                  <View style={styles.scheduleRow}>
  <View style={styles.scheduleItem}>
    <Text style={styles.scheduleLabel}>Contact Number</Text>
    
    <TouchableOpacity onPress={() => setIsEditable(!isEditable)}>
  <Text>{isEditable ? 'Cancel' : 'Edit'}</Text>
</TouchableOpacity>

    {isEditable && (
      <TouchableOpacity 
        onPress={() => {
          setContactNumber(user?.phoneNumber || '');
          setIsEditable(false);
        }}
        style={styles.resetButton}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>
    )}
  </View>

  {isEditable ? (
    <TextInput
      style={styles.contactInput}
      placeholder="Enter phone number"
      placeholderTextColor="#999"
      value={contactNumber}
      onChangeText={setContactNumber}
      keyboardType="phone-pad"
      autoFocus={true}
      testID="contact-number-input"
    />
  ) : (
    <TouchableOpacity 
      style={styles.contactDisplay}
      onPress={() => setIsEditable(true)}
    >
      <Text style={styles.contactNumberText}>
        {contactNumber || 'Not specified'}
      </Text>
    </TouchableOpacity>
  )}
</View>

                  <View style={styles.scheduleRow}>
                    <View style={styles.scheduleItem}>
                      <DollarSign size={20} color="#666" />
                      <Text style={styles.scheduleLabel}>Estimated Price</Text>
                    </View>
                    <Text style={styles.priceText}>${calculatePrice(selectedCar)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmSchedule}
                  >
                    <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                  </TouchableOpacity>
                </View>
              </>
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
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginLeft: 8,
  },
  editButtonText: {
    color: '#D4AF37',
    fontSize: 14,
  },
  resetButton: {
    marginLeft: 8,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
  },
  contactInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactDisplay: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  contactNumberText: {
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },

 
  name: {
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  trackButton: {
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  trackButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  upcomingRideCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  locationContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  currentLocation: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  destinationInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 16,
  },
  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#D4AF37',
    borderWidth: 1,
  },
  carImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  carInfo: {
    flex: 1,
    marginLeft: 16,
  },
  carName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 8,
  },
  carDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  price: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
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
    maxHeight: '80%',
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
});