import { auth } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
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
import { useUser } from './_layout';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {headerHeight} = useUser();

  // Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Status UI State
  const [status, setStatus] = useState<{ msg: string; type: 'error' | 'success' | null }>({
    msg: '',
    type: null
  });

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus({ msg: "Please fill in all fields.", type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ msg: "New passwords do not match.", type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ msg: "Password must be at least 6 characters.", type: 'error' });
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    if (user && user.email) {
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        
        setStatus({ msg: "Password changed successfully!", type: 'success' });
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          router.back();
        }, 2500);

      } catch (error: any) {
        setStatus({ msg: "Current password incorrect or connection error.", type: 'error' });
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.title}>Update Password</Text>
          <Text style={styles.subtitle}>Enter your details below to reset your credentials.</Text>

          {/* STATUS BANNER */}
          {status.msg ? (
            <View style={[
              styles.statusBanner, 
              status.type === 'success' ? styles.successBanner : styles.errorBanner
            ]}>
              <Ionicons 
                name={status.type === 'success' ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={status.type === 'success' ? "#1B5E20" : "#B71C1C"} 
              />
              <Text style={[
                styles.statusText, 
                { color: status.type === 'success' ? "#1B5E20" : "#B71C1C" }
              ]}>
                {status.msg}
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>CURRENT PASSWORD</Text>
          <TextInput 
            style={styles.input} 
            secureTextEntry 
            value={currentPassword} 
            onChangeText={setCurrentPassword} 
            placeholder="Type current password"
            placeholderTextColor="#C7C7CD"
          />

          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput 
            style={styles.input} 
            secureTextEntry 
            value={newPassword} 
            onChangeText={setNewPassword} 
            placeholder="Minimum 6 characters"
            placeholderTextColor="#E5E5EA" 
          />

          <Text style={styles.label}>REPEAT NEW PASSWORD</Text>
          <TextInput 
            style={styles.input} 
            secureTextEntry 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            placeholder="Type it again"
            placeholderTextColor="#C7C7CD"
          />

          <TouchableOpacity 
            style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
            onPress={handleUpdate} 
            disabled={loading}
          >
            {loading && status.type !== 'success' ? (
               <ActivityIndicator color="#FFF" /> 
            ) : (
               <Text style={styles.saveBtnText}>Save and Reset</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' }, // Standard background color
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  
  content: { padding: 30 },
  title: { fontSize: 26, fontWeight: '900', color: '#000', marginBottom: 5 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 25 },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
  },
  errorBanner: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  successBanner: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  statusText: { marginLeft: 10, fontSize: 14, fontWeight: '600', flexShrink: 1 },

  label: { fontSize: 11, fontWeight: '800', color: '#8E8E93', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 20, fontSize: 16, color: '#000', borderWidth: 1, borderColor: '#E5E5E7' },
  
  saveBtn: { backgroundColor: '#c62828', height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 15, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' }
});