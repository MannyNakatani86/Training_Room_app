import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { deleteUser, sendEmailVerification } from 'firebase/auth';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  
  // Capture email immediately so it stays if user is nullified during process
  const [displayEmail] = useState(auth.currentUser?.email || '');

  const [status, setStatus] = useState<{ msg: string; type: 'error' | 'success' | null }>({
    msg: '',
    type: null
  });

  const checkVerification = async () => {
    setLoading(true);
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setStatus({ msg: "Email verified! Welcome.", type: 'success' });
        setTimeout(() => router.replace('/(main)/(tabs)'), 1500);
      } else {
        setStatus({ msg: "Email not verified yet. Check your inbox.", type: 'error' });
      }
    } catch (error) {
      setStatus({ msg: "Error checking status. Try again.", type: 'error' });
    }
    setLoading(false);
  };

  const resendEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        setStatus({ msg: "Verification link resent!", type: 'success' });
      } catch (error) {
        setStatus({ msg: "Too many attempts. Try again later.", type: 'error' });
      }
    }
  };

  const handleUseDifferentEmail = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      // 1. Fetch current data to pass back to signup page
      const docRef = doc(db, "customers", user.uid);
      const docSnap = await getDoc(docRef);
      const userData = docSnap.exists() ? docSnap.data() : {};

      // 2. Delete the unverified user data and auth account
      await deleteDoc(docRef);
      await deleteUser(user);

      // 3. Navigate back to signup with existing data as parameters
      router.replace({
        pathname: '/signup',
        params: { 
          fName: userData.firstName, 
          lName: userData.lastName, 
          uName: userData.username, 
          bday: userData.dob,
          mail: userData.email
        }
      });
    } catch (error) {
      console.error(error);
      // Fallback: just sign out if deletion fails
      await auth.signOut();
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.iconCircle}><Ionicons name="mail-unread-outline" size={60} color="#c62828" /></View>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.description}>We've sent a verification link to{"\n"}<Text style={styles.emailText}>{displayEmail}</Text></Text>

        {status.msg ? (
          <View style={[styles.statusBanner, status.type === 'success' ? styles.successBanner : styles.errorBanner]}>
            <Ionicons name={status.type === 'success' ? "checkmark-circle" : "alert-circle"} size={18} color={status.type === 'success' ? "#4ADE80" : "#F87171"} />
            <Text style={[styles.statusText, { color: status.type === 'success' ? "#4ADE80" : "#F87171" }]}>{status.msg}</Text>
          </View>
        ) : <View style={{ height: 55 }} />}

        <TouchableOpacity style={styles.mainBtn} onPress={checkVerification} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.mainBtnText}>I've Verified My Email</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendBtn} onPress={resendEmail}><Text style={styles.resendText}>Resend Link</Text></TouchableOpacity>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleUseDifferentEmail}><Text style={styles.signOutText}>Use a different email</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 16, color: '#AAA', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  emailText: { color: '#FFF', fontWeight: 'bold' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 20, width: '100%', borderWidth: 1 },
  successBanner: { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ADE80' },
  errorBanner: { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderColor: '#F87171' },
  statusText: { marginLeft: 10, fontSize: 13, fontWeight: 'bold' },
  mainBtn: { backgroundColor: '#c62828', width: '100%', padding: 20, borderRadius: 15, alignItems: 'center' },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resendBtn: { marginTop: 25 },
  resendText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  signOutBtn: { marginTop: 40 },
  signOutText: { color: '#666', fontSize: 14, textDecorationLine: 'underline' }
});