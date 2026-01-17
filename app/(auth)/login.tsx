import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { logIn, resetPassword, signUp } from '../../services/authService';
import { saveCustomerData } from '../../services/customerServices';

export default function LoginScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const openAuth = (mode: 'login' | 'signup') => {
    setError(null);
    setAuthMode(mode);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    // Check for empty fields
    if (authMode === 'login') {
      if (!email || !password) {
        setError("Please fill in email and password"); // Your custom message
        return;
      }
    } else {
      // Signup mode requires the Name as well
      if (!name || !email || !password) {
        setError("Please fill in all details");
        return;
      }
    }

    setError(null);
    if (!email || !password || (authMode === 'signup' && !name)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    if (authMode === 'login') {
      const result = await logIn(email, password);
      if (!result.success) {
        // Here we show your custom message
        setError("Either your email or password does not match"); 
      }
    } else {
      const result = await signUp(email, password);
      if (result.success && result.user) {
        await saveCustomerData(result.user.uid, { name, email });
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  // Forgot Password Handler
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Email Needed", "Please type your email address first.");
      return;
    }
    const result = await resetPassword(email);
    if (result.success) {
      Alert.alert("Email Sent", "Check your inbox for a password reset link.");
    } else {
      Alert.alert("Error", "Could not send reset email. Check your address.");
    }
  };

  return (
    <View style={styles.container}>
      {modalVisible && <View style={styles.instantOverlay} />}

      {/* 1. BACKGROUND / LOGO SECTION */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/training_room_logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.slogan}>Maybe our slogan here?</Text>
      </View>

      {/* 2. INITIAL BUTTONS AT BOTTOM */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => openAuth('login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={() => openAuth('signup')}
        >
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      {/* 3. RISING BOTTOM SHEET (MODAL) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Android back button
      >
        {/* This Pressable makes it so clicking the empty space above the sheet closes it */}
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)} 
        />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContainer}
        >
          <View style={styles.bottomSheet}>
            {/* The "Handle" bar at the top of the sheet */}
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>
              {authMode === 'login' ? 'Welcome Back!' : 'Create Profile'}
            </Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {authMode === 'signup' && (
              <TextInput 
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            )}

            <TextInput 
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput 
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
              <>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>
                    {authMode === 'login' ? 'Log In' : 'Get Started'}
                  </Text>
                </TouchableOpacity>

                {authMode === 'login' && (
                  <TouchableOpacity 
                    style={styles.forgotBtn} 
                    onPress={() => {
                      setModalVisible(false);
                      router.push('/forgot-password');
                    }}
                  >
                    <Text style={styles.forgotBtnText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  instantOverlay: {
    ...StyleSheet.absoluteFillObject, // Makes it cover the whole screen
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1, // Ensures it sits above the logo but below the Modal
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 300,
    height: 300,
  },
  slogan: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#ffffff',
    marginTop: 10,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    gap: 15,
  },
  loginButton: {
    backgroundColor: '#c62828',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  signupButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 60, // Extra space for keyboard and safe area
    minHeight: '55%', // Fills about half the screen
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: 50,
    height: 6,
    backgroundColor: '#DDD',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F5F5F7',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#c62828',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30', // Red
    textAlign: 'center',
    marginBottom: 15,
    marginTop: -10, // Pulls it closer to the title
    fontWeight: '600',
  },
  forgotBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotBtnText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  }, 
});
