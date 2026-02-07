import { auth } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Mock states for switches
  const [notifications, setNotifications] = useState(true);
  const [metricUnits, setMetricUnits] = useState(true); // kg vs lbs

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your workout data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log("Delete logic here") }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ACCOUNT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <SettingRow icon="mail-outline" title="Email" value={auth.currentUser?.email || ''} />
            <SettingRow icon="lock-closed-outline" title="Change Password" showArrow onPress={() => {}} />
            <SettingRow icon="shield-outline" title="Two-Factor Auth" showArrow onPress={() => {}} />
          </View>
        </View>

        {/* PREFERENCES SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="notifications-outline" size={20} color="#1976D2" />
                </View>
                <Text style={styles.rowTitle}>Push Notifications</Text>
              </View>
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="stats-chart-outline" size={20} color="#388E3C" />
                </View>
                <Text style={styles.rowTitle}>Use Metric (kg)</Text>
              </View>
              <Switch 
                value={metricUnits} 
                onValueChange={setMetricUnits}
                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
              />
            </View>
          </View>
        </View>

        {/* PRIVACY SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>
          <View style={styles.card}>
            <SettingRow icon="document-text-outline" title="Privacy Policy" showArrow onPress={() => {}} />
            <SettingRow icon="reader-outline" title="Terms of Service" showArrow onPress={() => {}} />
            <SettingRow icon="help-circle-outline" title="Contact Support" showArrow onPress={() => {}} />
          </View>
        </View>

        {/* DANGER ZONE */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Internal Helper Component for Rows
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
          <Ionicons name={icon} size={20} color="#666" />
        </View>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  
  scrollContent: { padding: 20 },
  
  section: { marginBottom: 25 },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#8E8E93', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    marginLeft: 5,
    letterSpacing: 0.5
  },
  
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E7'
  },
  
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 15,
    backgroundColor: '#FFF'
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  
  iconBox: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: '#F2F2F7', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  rowTitle: { fontSize: 16, color: '#000', fontWeight: '400' },
  rowValue: { fontSize: 14, color: '#8E8E93', marginRight: 10 },
  
  divider: { height: 1, backgroundColor: '#E5E5E7', marginLeft: 60 },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteBtnText: { 
    color: '#FF3B30', 
    fontWeight: '600', 
    fontSize: 16, 
    marginLeft: 10 
  },
});