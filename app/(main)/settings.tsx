import { auth } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Switch States
  const [notifications, setNotifications] = useState(true);
  
  // Units State: true = kg (Metric), false = lbs (Imperial)
  const [isMetric, setIsMetric] = useState(true); 

  const handleDeleteAccountNav = () => {
    router.push('/(main)/delete-account');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <SettingRow 
              icon="mail-outline" 
              title="Email" 
              value={auth.currentUser?.email || 'Not logged in'} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="lock-closed-outline" 
              title="Change Password" 
              showArrow 
              onPress={() => router.push('/(main)/change-password')} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="shield-checkmark-outline" 
              title="Two-Factor Auth" 
              showArrow 
              onPress={() => router.push('/(main)/two-factor')} 
            />
          </View>
        </View>

        {/* SECTION 2: PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.card}>
            {/* Notifications Toggle */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="notifications-outline" size={20} color="#c62828" />
                </View>
                <Text style={styles.rowTitle}>Notifications</Text>
              </View>
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
              />
            </View>

            <View style={styles.divider} />

            {/* Units Toggle (kg vs lbs) */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#F2F2F7' }]}>
                  <Ionicons name="scale-outline" size={20} color="#666" />
                </View>
                <View>
                    {/* Dynamic Label based on state */}
                    <Text style={styles.rowTitle}>{isMetric ? "Metric (kg)" : "Imperial (lbs)"}</Text>
                    <Text style={styles.rowSubLabel}>Preferred weight units</Text>
                </View>
              </View>
              <Switch 
                value={isMetric} 
                onValueChange={setIsMetric}
                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: PRIVACY & LEGAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>
          <View style={styles.card}>
            <SettingRow icon="document-text-outline" title="Privacy Policy" showArrow onPress={() => {}} />
            <View style={styles.divider} />
            <SettingRow icon="reader-outline" title="Terms of Service" showArrow onPress={() => {}} />
            <View style={styles.divider} />
            <SettingRow icon="help-circle-outline" title="Contact Support" showArrow onPress={() => {}} />
          </View>
        </View>

        {/* DANGER ZONE */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccountNav}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon, title, value, showArrow, onPress }: any) {
  return (
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color="#444" />
        </View>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>}
        {showArrow && <Ionicons name="chevron-forward" size={18} color="#CCC" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7'
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
  card: { backgroundColor: '#FFF', borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E7' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#FFF' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowRight: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowTitle: { fontSize: 16, color: '#000', fontWeight: '500' },
  rowSubLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  rowValue: { fontSize: 14, color: '#8E8E93', marginRight: 8, maxWidth: '70%' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 60 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#FF3B30', marginTop: 10 },
  deleteBtnText: { color: '#FF3B30', fontWeight: '700', fontSize: 16, marginLeft: 10 },
});