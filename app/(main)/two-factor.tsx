import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TwoFactorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isEnabled, setIsEnabled] = useState(false);

  const toggle2FA = () => {
    if (!isEnabled) {
      Alert.alert("Enable 2FA", "To enable 2FA, we will send a code to your registered email/phone.");
    }
    setIsEnabled(!isEnabled);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Two-Factor Auth</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={50} color="#c62828" />
        </View>
        <Text style={styles.title}>Secure Your Account</Text>
        <Text style={styles.description}>
          Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to log in.
        </Text>

        <View style={styles.toggleCard}>
          <View>
            <Text style={styles.toggleTitle}>Authentication App</Text>
            <Text style={styles.toggleSub}>Highly recommended</Text>
          </View>
          <Switch 
            value={isEnabled} 
            onValueChange={toggle2FA}
            trackColor={{ false: "#D1D1D6", true: "#34C759" }}
          />
        </View>

        <Text style={styles.footerNote}>
          We will use your primary email address for verification codes.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 30, alignItems: 'center' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  description: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  toggleCard: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9FB', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
  toggleTitle: { fontSize: 16, fontWeight: '700' },
  toggleSub: { fontSize: 12, color: '#34C759', fontWeight: '600', marginTop: 2 },
  footerNote: { fontSize: 12, color: '#AAA', textAlign: 'center', marginTop: 20 }
});