import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    console.log('Login attempt started');
    console.log('Email:', email);
    console.log('Password:', password );

    try {
      console.log('Calling signIn function...');
      await signIn(email, password);
      console.log('Login successful - user authenticated');
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        console.log('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      } else if (error instanceof Error) {
        console.log('Error details:', { message: 'Unknown error', stack: null });
      }

      // More specific error messages based on error type
      if (error instanceof Error && error.message.includes('Network')) {
        Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection.');
      } else if (error instanceof Error && error.message.includes('credentials')) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      } else {
        Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1635769736098-d1f7c8b3e35e?auto=format&fit=crop&w=800&q=80' }}
          style={styles.logo}
        />
        <Text style={styles.title}>LOXURYA</Text>
        <Text style={styles.subtitle}>Luxury at your fingertips</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={(text) => {
              console.log('Email updated:', text);
              setEmail(text);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={(text) => {
              console.log('Password updated:', text ? '*****' : 'empty');
              setPassword(text);
            }}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSignIn}
            onPressIn={() => console.log('Login button pressed')}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <Link href="/register" asChild>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => console.log('Navigate to register pressed')}
            >
              <Text style={styles.linkText}>Don't have an account? Register</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Your existing styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Playfair-Bold',
    fontSize: 36,
    color: '#D4AF37',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#fff',
    marginBottom: 48,
  },
  form: {
    width: '100%',
    maxWidth: 400,
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
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#1a1a1a',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  linkButton: {
    alignItems: 'center',
    padding: 8,
  },
  linkText: {
    color: '#D4AF37',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});