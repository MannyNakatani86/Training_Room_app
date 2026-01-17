import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { resetPassword } from '../../services/authService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address first.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Check Your Email", 
        "A password reset link has been sent to your inbox.",
        [{ text: "OK", onPress: () => router.back() }] // Send them back to login after they click OK
      );
    } else {
      Alert.alert("Error", "That email address wasn't found. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back to Login</Text>
      </TouchableOpacity>

      <View style={styles.innerContainer}>
        <Image 
          source={require('../../assets/training_room_logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.instructions}>
          Enter the email associated with your account and we'll send a link to reset your password.
        </Text>

        <TextInput 
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  backLink: {
    marginTop: 60,
    marginLeft: 25,
  },
  backLinkText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    padding: 18,
    borderRadius: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#c62828',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});