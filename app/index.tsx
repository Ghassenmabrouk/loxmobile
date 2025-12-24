import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading, userData } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4facfe" />
      </View>
    );
  }

  if (isAuthenticated && userData) {
    const role = userData.role || 'user';

    if (role === 'driver') {
      return <Redirect href="/(tabs)/driver-home" />;
    } else if (role === 'admin') {
      return <Redirect href="/(tabs)/admin" />;
    } else {
      return <Redirect href="/(tabs)/on-time-home" />;
    }
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
});