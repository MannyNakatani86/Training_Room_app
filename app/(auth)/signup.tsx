import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signUp } from '../../services/authService';
import { isUsernameUnique, saveCustomerData } from '../../services/customerServices';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSignup = async () => {
    setError(null);
    if (!firstName || !lastName || !dob || !email || !password || !confirmPassword || !username) {
      setError("All fields are required"); return;
    }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreedToTerms) { setError("Please agree to Terms"); return; }

    setLoading(true);
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
      setError("Username is taken"); setLoading(false); return;
    }

    const result = await signUp(email, password);
    if (result.success && result.user) {
      await saveCustomerData(result.user.uid, { 
        firstName, lastName, dob, email, username: username.toLowerCase().trim(),
        name: `${firstName} ${lastName}`
      });
      Alert.alert("Success", "Check your email to verify your account.");
      router.replace('/login');
    } else {
      setError(result.error || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

          <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#999" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#999" value={lastName} onChangeText={setLastName} />
          <TextInput style={styles.input} placeholder="Birthday (DD/MM/YYYY)" placeholderTextColor="#999" value={dob} onChangeText={setDob} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#999" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#999" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
            <Ionicons name={agreedToTerms ? "checkbox" : "square-outline"} size={22} color={agreedToTerms ? "#c62828" : "#999"} />
            <Text style={styles.termsText}>I agree to the <Text style={styles.linkText} onPress={() => WebBrowser.openBrowserAsync('https://trainingroomcoach.com/terms-and-conditions')}>Terms & Conditions</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Create Account</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 30, paddingTop: 20 },
  input: { backgroundColor: '#1C1C1E', color: '#FFF', padding: 18, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  errorBox: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 10, marginBottom: 20 },
  errorText: { color: '#FF3B30', textAlign: 'center', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#c62828', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  termsText: { color: '#AAA', marginLeft: 10, fontSize: 13 },
  linkText: { color: '#c62828', fontWeight: 'bold' }
});