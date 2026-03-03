import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { logIn } from '../../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    const result = await logIn(email, password);
    if (!result.success) setError("Invalid email or password");
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* BRANDING SECTION */}
          <View style={styles.brandingContainer}>
            <Image source={require('../../assets/training_room_logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.slogan}>{"Athlete-Built.\nPerformance-Driven"}</Text>
          </View>

          {/* INPUT SECTION */}
          <View style={styles.formContainer}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <View style={styles.passwordWrapper}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                placeholder="Password" 
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotBtn}>
              <Text style={styles.forgotBtnText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* BOTTOM FOOTER (Instagram Style) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupLinkText}>Sign up.</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 40 },
  brandingContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 220, height: 220 },
  slogan: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#ffffff', 
    textAlign: 'center', 
    lineHeight: 32, 
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    marginTop: 10 
  },
  formContainer: { width: '100%' },
  input: { backgroundColor: '#1C1C1E', color: '#FFF', padding: 18, borderRadius: 15, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 15, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  eyeIcon: { paddingHorizontal: 15 },
  loginButton: { backgroundColor: '#c62828', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#FF3B30', textAlign: 'center', marginBottom: 15, fontWeight: '600' },
  forgotBtn: { marginTop: 20, alignItems: 'center' },
  forgotBtnText: { color: '#AAA', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20, borderTopWidth: 0.5, borderTopColor: '#333' },
  footerText: { color: '#888' },
  signupLinkText: { color: '#FFF', fontWeight: 'bold' }
});