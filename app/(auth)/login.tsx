import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { logIn, signUp } from '../../services/authService';
import { isUsernameUnique, saveCustomerData } from '../../services/customerServices';

export default function LoginScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Only for primary password
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const openAuth = (mode: 'login' | 'signup') => {
    setError(null);
    setAuthMode(mode);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    setError(null);

    if (authMode === 'login') {
      if (!email || !password) {
        setError("Please fill in email and password");
        return;
      }
      setLoading(true);
      const result = await logIn(email, password);
      if (!result.success) setError("Invalid email or password"); 
      setLoading(false);
    } else {
      // --- SIGNUP VALIDATION ---
      if (!firstName || !lastName || !email || !password || !confirmPassword || !username) {
        setError("All fields are required");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!agreedToTerms) {
        setError("Please agree to the Terms & Conditions");
        return;
      }

      setLoading(true);

      // 1. Check if Username is taken (Case-insensitive)
      const isUnique = await isUsernameUnique(username);
      if (!isUnique) {
        setError("This username is already taken");
        setLoading(false);
        return;
      }

      // 2. Attempt Signup (Auth Service handles email verification)
      const result = await signUp(email, password);
      
      if (result.success && result.user) {
        // 3. Save detailed profile data
        await saveCustomerData(result.user.uid, { 
          firstName, 
          lastName, 
          name: `${firstName} ${lastName}`,
          email, 
          username: username.toLowerCase().trim()
        });
        
        setModalVisible(false);
        Alert.alert(
          "Verify Your Email", 
          "We've sent a link to your email. Please verify your account before logging in."
        );
      } else {
        if (result.error?.includes('email-already-in-use')) {
          setError("This email address is already registered");
        } else {
          setError(result.error || "An error occurred");
        }
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {modalVisible && <View style={styles.instantOverlay} />}

      <View style={styles.logoContainer}>
        <Image source={require('../../assets/training_room_logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.slogan}>{"Athlete-Built.\nPerformance-Driven"}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={() => openAuth('login')}><Text style={styles.loginButtonText}>Login</Text></TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={() => openAuth('signup')}><Text style={styles.signupButtonText}>Create Account</Text></TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetContainer}>
          <View style={[styles.bottomSheet, authMode === 'signup' && { minHeight: '85%' }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{authMode === 'login' ? 'Welcome Back' : 'Create Profile'}</Text>

            {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {authMode === 'signup' && (
                <>
                  <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                    <TextInput style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
                  </View>
                  <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                </>
              )}

              <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

              {/* PRIMARY PASSWORD (TOGGLEABLE) */}
              <View style={styles.passwordWrapper}>
                <TextInput 
                  style={[styles.input, { marginBottom: 0, flex: 1 }]} 
                  placeholder="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPassword} 
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* CONFIRM PASSWORD (ALWAYS MASKED) */}
              {authMode === 'signup' && (
                <TextInput 
                  style={[styles.input, { marginTop: 15 }]} 
                  placeholder="Confirm Password" 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword} 
                  secureTextEntry={true} 
                />
              )}

              {authMode === 'signup' && (
                <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                  <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={22} color={agreedToTerms ? "#c62828" : "#999"} />
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.linkText} onPress={() => WebBrowser.openBrowserAsync('https://yourwebsite.com/terms')}>Terms & Conditions</Text>
                  </Text>
                </TouchableOpacity>
              )}

              {loading ? (
                <ActivityIndicator size="large" color="#c62828" style={{ marginTop: 20 }} />
              ) : (
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>{authMode === 'login' ? 'Log In' : 'Get Started'}</Text>
                </TouchableOpacity>
              )}

              {authMode === 'login' && (
                <TouchableOpacity style={styles.forgotBtn} onPress={() => { setModalVisible(false); router.push('/forgot-password'); }}>
                  <Text style={styles.forgotBtnText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between', paddingVertical: 60 },
  instantOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 },
  logoContainer: { alignItems: 'center', marginTop: 40 },
  logo: { width: 300, height: 300 },
  slogan: { fontSize: 30, fontWeight: '900', color: '#ffffff', textAlign: 'center', lineHeight: 32 },
  buttonContainer: { paddingHorizontal: 40, gap: 15 },
  loginButton: { backgroundColor: '#c62828', padding: 20, borderRadius: 15, alignItems: 'center' },
  loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  signupButton: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  signupButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1 },
  sheetContainer: { position: 'absolute', bottom: 0, width: '100%' },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 30, paddingTop: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
  handle: { width: 50, height: 6, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', marginBottom: 15 },
  input: { backgroundColor: '#F5F5F7', padding: 18, borderRadius: 15, fontSize: 16 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F7', borderRadius: 15 },
  eyeIcon: { paddingHorizontal: 15 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 5 },
  termsText: { fontSize: 13, color: '#666', marginLeft: 10 },
  linkText: { color: '#c62828', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#c62828', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 25 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  errorBox: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 10, marginBottom: 15 },
  errorText: { color: '#FF3B30', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  forgotBtn: { marginTop: 15, alignItems: 'center', paddingBottom: 20 },
  forgotBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
});