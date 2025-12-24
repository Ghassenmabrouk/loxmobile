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
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontFamily: 'Inter-Regular',
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="rides"
        options={{
          title: 'My Rides',
          tabBarIcon: ({ size, color }) => <Ionicons name="calendar" size={size} color={color} />,
          href: isUser || isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="driver-schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ size, color }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          href: isDriver ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ size, color }) => <Ionicons name="shield" size={size} color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="track"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="LocationAutocomplete"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="customer-home"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="driver-home"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="driver-ride-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}