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

  const handleDeleteProcedure = async () => {
    if (!password) {
      Alert.alert("Required", "Please enter your password to confirm account deletion.");
      return;
    }

    Alert.alert(
      "Final Confirmation",
      "Are you absolutely sure? All your progress, PRs, and profile data will be permanently erased.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive", 
          onPress: performDeletion 
        }
      ]
    );
  };

  const performDeletion = async () => {
    setLoading(true);
    const user = auth.currentUser;

    if (user && user.email) {
      try {
        // 1. Re-authenticate (Required by Firebase for sensitive actions)
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        // 2. Clean up Firestore and Storage data
        await deleteUserData(user.uid);

        // 3. Delete the Auth Account
        await deleteUser(user);
        
        // Root Layout listener will detect user is null and send to Login
        Alert.alert("Account Deleted", "Your data has been removed. Goodbye!");
        
      } catch (error: any) {
        let msg = "Incorrect password or connection error.";
        if (error.code === 'auth/wrong-password') msg = "The password you entered is incorrect.";
        Alert.alert("Error", msg);
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
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={40} color="#FF3B30" />
          <Text style={styles.warningTitle}>Account Deletion</Text>
          <Text style={styles.warningText}>
            This action is permanent. You will lose your exercise history, body metrics, and training plan access immediately.
          </Text>
        </View>

        <Text style={styles.label}>CONFIRM PASSWORD TO PROCEED</Text>
        <TextInput 
          style={styles.input} 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
          placeholder="Enter your password"
          placeholderTextColor="#AAA"
        />

        <TouchableOpacity 
          style={[styles.deleteBtn, loading && { opacity: 0.6 }]} 
          onPress={handleDeleteProcedure}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.deleteBtnText}>Permanently Delete My Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>I've changed my mind</Text>
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
  warningCard: { backgroundColor: '#FFF5F5', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 35, borderWidth: 1, borderColor: '#FFE0E0' },
  warningTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginTop: 10 },
  warningText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  label: { fontSize: 11, fontWeight: '800', color: '#8E8E93', marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: '#F2F2F7', padding: 18, borderRadius: 15, marginBottom: 30, fontSize: 16 },
  deleteBtn: { backgroundColor: '#FF3B30', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  deleteBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { alignItems: 'center', marginTop: 25 },
  cancelText: { color: '#007AFF', fontWeight: '600' }
});