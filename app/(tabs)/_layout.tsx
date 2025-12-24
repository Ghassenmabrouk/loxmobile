import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { isAuthenticated, isLoading, userData } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const userRole = userData?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isDriver = userRole === 'driver';
  const isUser = userRole === 'user' || !userRole;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#4facfe',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontFamily: 'Inter-Regular',
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="on-time-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />,
          href: isUser || isAdmin ? '/(tabs)/on-time-home' : null,
        }}
      />

      <Tabs.Screen
        name="driver-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />,
          href: isDriver ? '/(tabs)/driver-home' : null,
        }}
      />

      <Tabs.Screen
        name="mission-history"
        options={{
          title: 'History',
          tabBarIcon: ({ size, color }) => <Ionicons name="time" size={size} color={color} />,
          href: isUser ? '/(tabs)/mission-history' : null,
        }}
      />

      <Tabs.Screen
        name="driver-schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ size, color }) => <Ionicons name="calendar" size={size} color={color} />,
          href: isDriver ? '/(tabs)/driver-schedule' : null,
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ size, color }) => <Ionicons name="shield" size={size} color={color} />,
          href: isAdmin ? '/(tabs)/admin' : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="track" options={{ href: null }} />
      <Tabs.Screen name="locations" options={{ href: null }} />
      <Tabs.Screen name="LocationAutocomplete" options={{ href: null }} />
      <Tabs.Screen name="customer-home" options={{ href: null }} />
      <Tabs.Screen name="rides" options={{ href: null }} />
      <Tabs.Screen name="driver-ride-detail" options={{ href: null }} />
      <Tabs.Screen name="active-ride-navigation" options={{ href: null }} />
      <Tabs.Screen name="mission-booking" options={{ href: null }} />
      <Tabs.Screen name="mission-tracking" options={{ href: null }} />
      <Tabs.Screen name="driver-mission-view" options={{ href: null }} />
    </Tabs>
  );
}
