import { auth } from '@/fireBaseConfig';
import { deleteUserData } from '@/services/customerServices';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      Alert.alert("Required", "Please enter your password to confirm.");
      return;
    }

    Alert.alert(
      "Final Warning",
      "This will permanently delete your profile, workouts, and account history. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Everything", 
          style: "destructive", 
          onPress: executeDeletion 
        }
      ]
    );
  };

  const executeDeletion = async () => {
    setLoading(true);
    const user = auth.currentUser;

    if (user && user.email) {
      try {
        // 1. Re-authenticate
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        // 2. Delete Data from Firestore
        await deleteUserData(user.uid);

        // 3. Delete from Auth
        await deleteUser(user);
        
        // This will automatically trigger the Root Layout redirect to Login
      } catch (error: any) {
        Alert.alert("Error", error.message);
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={40} color="#FF3B30" />
          <Text style={styles.warningTitle}>We're sorry to see you go.</Text>
          <Text style={styles.warningText}>
            Deleting your account will remove all your progress, saved exercises, and personal data. This process is immediate and permanent.
          </Text>
        </View>

        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <TextInput 
          style={styles.input} 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
          placeholder="Enter your password"
        />

        <TouchableOpacity 
          style={[styles.deleteBtn, loading && { opacity: 0.5 }]} 
          onPress={handleDelete}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.deleteBtnText}>Permanently Delete My Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 25 },
  warningBox: { backgroundColor: '#FFF5F5', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#FFE0E0' },
  warningTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginTop: 10 },
  warningText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#AAA', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, marginBottom: 25, fontSize: 16 },
  deleteBtn: { backgroundColor: '#FF3B30', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});