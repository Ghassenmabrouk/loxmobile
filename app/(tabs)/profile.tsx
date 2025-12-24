import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

const MENU_ITEMS = [
  {
    id: '1',
    icon: 'card',
    title: 'Payment Methods',
    subtitle: 'Manage your payment options',
  },
  {
    id: '2',
    icon: 'notifications',
    title: 'Notifications',
    subtitle: 'Configure your notifications',
  },
  {
    id: '3',
    icon: 'shield',
    title: 'Privacy & Security',
    subtitle: 'Manage your account security',
  },
  {
    id: '4',
    icon: 'settings',
    title: 'Settings',
    subtitle: 'App preferences and more',
  },
];

export default function ProfileScreen() {
  const { signOut } = useAuth();

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
                source={{ uri: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.avatar}
              />
              <LinearGradient
                colors={['#D4AF37', '#C5A028']}
                style={styles.vipBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={14} color="#1A1A1A" />
                <Text style={styles.vipText}>VIP</Text>
              </LinearGradient>
            </View>
            <Text style={styles.name}>Alexander Thompson</Text>
            <Text style={styles.email}>ghassen@example.com</Text>
            <TouchableOpacity style={styles.editButton}>
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
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F8F8F8']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="star" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F8F8F8']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="location" size={24} color="#D4AF37" />
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </LinearGradient>
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <LinearGradient
                colors={['#FFFFFF', '#F8F8F8']}
                style={styles.menuItemGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={22} color="#D4AF37" />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
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
});