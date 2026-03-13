import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signUp } from '../../services/authService';
import { isUsernameUnique, saveCustomerData } from '../../services/customerServices';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // Form States - Prefilled if coming back from verification
  const [firstName, setFirstName] = useState((params.fName as string) || '');
  const [lastName, setLastName] = useState((params.lName as string) || '');
  const [dob, setDob] = useState((params.bday as string) || ''); 
  const [username, setUsername] = useState((params.uName as string) || '');
  const [email, setEmail] = useState((params.mail as string) || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleDobInput = (text: string) => {
    if (text.length < dob.length) { setDob(text); return; }
    let cleaned = text.replace(/\D/g, '');
    let formatted = "";
    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        formatted += '/' + cleaned.slice(2, 4);
        if (cleaned.length > 4) formatted += '/' + cleaned.slice(4, 8);
      }
    }
    setDob(formatted);
  };

  const handleSignup = async () => {
    setError(null);
    if (!firstName || !lastName || !dob || !email || !password || !confirmPassword || !username) {
      setError("All fields are required"); return;
    }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms & Conditions"); return; }

    setLoading(true);
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) { setError("This username is already taken"); setLoading(false); return; }

    const result = await signUp(email, password);
    if (result.success && result.user) {
      // Create the cleaned version once to use for both fields
      const lowerUsername = username.toLowerCase().trim();

      await saveCustomerData(result.user.uid, { 
        firstName, 
        lastName, 
        dob, 
        email, 
        username: lowerUsername,
        handle: lowerUsername, // ADDED THIS: Profile page needs 'handle' to display correctly
        name: `${firstName} ${lastName}`
      });

      // --- THE FIX: Manually move to verification page ---
      router.replace('/(auth)/verify-email');
      
    } else {
      setError(result.error?.includes('email-already-in-use') ? "Email already registered" : result.error || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#999" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#999" value={lastName} onChangeText={setLastName} />
          <TextInput style={styles.input} placeholder="Birthday (MM/DD/YYYY)" placeholderTextColor="#999" value={dob} onChangeText={handleDobInput} keyboardType="numeric" maxLength={10} />
          <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#999" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#999" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
            <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={22} color={agreedToTerms ? "#c62828" : "#999"} />
            <Text style={styles.termsText}>I agree to the <Text style={styles.linkText} onPress={() => WebBrowser.openBrowserAsync('https://trainingroomcoach.com/terms-and-conditions')}>Terms & Conditions</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.submitButton, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Create Account</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 30, paddingTop: 10, paddingBottom: 40 },
  input: { backgroundColor: '#1C1C1E', color: '#FFF', padding: 18, borderRadius: 15, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  errorBox: { backgroundColor: '#FFEBEE', padding: 15, borderRadius: 12, marginBottom: 20 },
  errorText: { color: '#FF3B30', textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  termsText: { color: '#AAA', marginLeft: 10, fontSize: 13 },
  linkText: { color: '#c62828', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#c62828', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 5 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});