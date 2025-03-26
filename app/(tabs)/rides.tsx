import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, MapPin } from 'lucide-react-native';

const RIDES = [
  {
    id: '1',
    date: 'Today',
    time: '14:30',
    from: '123 Park Avenue',
    to: 'JFK Airport',
    car: 'Mercedes S-Class',
    status: 'Upcoming',
  },
  {
    id: '2',
    date: 'Yesterday',
    time: '19:45',
    from: 'Grand Central',
    to: 'The Plaza Hotel',
    car: 'BMW 7 Series',
    status: 'Completed',
  },
];

export default function RidesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
      </View>

      <FlatList
        data={RIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.dateTime}>
                <Calendar size={16} color="#666" />
                <Text style={styles.dateTimeText}>{item.date}</Text>
                <Clock size={16} color="#666" />
                <Text style={styles.dateTimeText}>{item.time}</Text>
              </View>
              <Text style={[
                styles.status,
                { color: item.status === 'Upcoming' ? '#D4AF37' : '#4CAF50' }
              ]}>{item.status}</Text>
            </View>

            <View style={styles.locations}>
              <View style={styles.location}>
                <MapPin size={16} color="#666" />
                <Text style={styles.locationText}>{item.from}</Text>
              </View>
              <View style={styles.location}>
                <MapPin size={16} color="#D4AF37" />
                <Text style={styles.locationText}>{item.to}</Text>
              </View>
            </View>

            <Text style={styles.carName}>{item.car}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 32,
    color: '#1a1a1a',
  },
  list: {
    padding: 20,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 12,
  },
  status: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  locations: {
    marginBottom: 12,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  carName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#666',
  },
});