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
  const [dob, setDob] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      if (!firstName || !lastName || !dob || !email || !password || !confirmPassword || !username) {
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
      const isUnique = await isUsernameUnique(username);
      if (!isUnique) {
        setError("This username is already taken");
        setLoading(false);
        return;
      }

      const result = await signUp(email, password);
      if (result.success && result.user) {
        await saveCustomerData(result.user.uid, { 
          firstName, lastName, dob, 
          name: `${firstName} ${lastName}`,
          email, username: username.toLowerCase().trim()
        });
        setModalVisible(false);
        Alert.alert("Verify Email", "Please check your inbox to verify your account.");
      } else {
        setError(result.error?.includes('email-already-in-use') ? "Email already registered" : result.error || "Signup failed");
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {modalVisible && <View style={styles.instantOverlay} />}

      <View style={styles.logoContainer}>
        <Image source={require('../../assets/training_room_logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.sloganContainer}>
        <Text style={styles.slogan}>{"Athlete-Built.\nPerformance-Driven"}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={() => openAuth('login')}><Text style={styles.loginButtonText}>Login</Text></TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={() => openAuth('signup')}><Text style={styles.signupButtonText}>Create Account</Text></TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetContainer}>
          <View style={styles.bottomSheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{authMode === 'login' ? 'Welcome Back' : 'Create Profile'}</Text>

            {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {authMode === 'signup' && (
                <>
                  <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                  <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
                  <TextInput style={styles.input} placeholder="Date of Birth (DD/MM/YYYY)" value={dob} onChangeText={setDob} keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                </>
              )}

              <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

              <View style={styles.passwordWrapper}>
                <TextInput 
                  style={[styles.input, { marginBottom: 0, flex: 1 }]} 
                  placeholder="Password" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry={!showPassword} 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {authMode === 'signup' && (
                <>
                  <TextInput style={[styles.input, { marginTop: 15 }]} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={true} />
                  
                  <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                    <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={22} color={agreedToTerms ? "#c62828" : "#999"} />
                    <Text style={styles.termsText}>
                      I agree to the <Text style={styles.linkText} onPress={() => WebBrowser.openBrowserAsync('https://www.trainingroomcoach.com/terms-and-conditions')}>Terms & Conditions</Text>
                    </Text>
                  </TouchableOpacity>
                </>
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
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between', paddingVertical: 80 },
  instantOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 },
  logoContainer: { alignItems: 'center' },
  logo: { width: 250, height: 250 },
  sloganContainer: { alignItems: 'center', justifyContent: 'center' },
  slogan: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#ffffff', 
    textAlign: 'center', 
    lineHeight: 32, 
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif' 
  },
  buttonContainer: { paddingHorizontal: 40, gap: 15 },
  loginButton: { backgroundColor: '#c62828', padding: 20, borderRadius: 15, alignItems: 'center' },
  loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  signupButton: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  signupButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1 },
  sheetContainer: { position: 'absolute', bottom: 0, width: '100%' },
  bottomSheet: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 30, 
    paddingTop: 15, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 20,
    height: '80%' // FIXED HEIGHT at 80%
  },
  handle: { width: 50, height: 6, backgroundColor: '#DDD', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#F5F5F7', padding: 15, borderRadius: 15, fontSize: 16, marginBottom: 15 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F7', borderRadius: 15, marginBottom: 5 },
  eyeIcon: { paddingHorizontal: 15 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingHorizontal: 5 },
  termsText: { fontSize: 13, color: '#666', marginLeft: 10 },
  linkText: { color: '#c62828', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#c62828', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 25 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  errorBox: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 10, marginBottom: 10 },
  errorText: { color: '#FF3B30', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  forgotBtn: { marginTop: 15, alignItems: 'center', paddingBottom: 20 },
  forgotBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
});