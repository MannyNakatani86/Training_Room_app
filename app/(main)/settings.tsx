import { auth } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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
import { useUser } from './_layout'; // Import from the same folder

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {headerHeight} = useUser();
  
  // Grab global state from our new Master Layout
  const { unit, toggleUnit } = useUser();

  // Local state for notifications
  const [notifications, setNotifications] = useState(true);

  const openLegalLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, { 
      toolbarColor: '#000000', 
      controlsColor: '#c62828' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
           <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* SECTION 1: ACCOUNT INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <SettingRow 
              icon="mail-outline" 
              title="Email" 
              value={auth.currentUser?.email || 'N/A'} 
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

        {/* SECTION 2: APP PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.card}>
            {/* Notifications Row */}
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

            {/* THE TWO-BOX UNIT SELECTOR */}
            <View style={styles.unitContainer}>
              <Text style={styles.unitLabel}>Unit of Measurement</Text>
              <View style={styles.unitBoxWrapper}>
                <TouchableOpacity 
                  style={[styles.unitBox, unit === 'kg' && styles.unitBoxActive]} 
                  onPress={() => toggleUnit('kg')}
                >
                  <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>Kilograms (kg)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.unitBox, unit === 'lbs' && styles.unitBoxActive]} 
                  onPress={() => toggleUnit('lbs')}
                >
                  <Text style={[styles.unitText, unit === 'lbs' && styles.unitTextActive]}>Pounds (lbs)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 3: PRIVACY & LEGAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Legal</Text>
          <View style={styles.card}>
            <SettingRow 
              icon="document-text-outline" 
              title="Privacy Policy" 
              showArrow 
              onPress={() => openLegalLink('https://www.trainingroomcoach.com/privacy-policy')} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="reader-outline" 
              title="Terms of Service" 
              showArrow 
              onPress={() => openLegalLink('https://www.trainingroomcoach.com/terms-and-conditions')} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="help-circle-outline" 
              title="Contact Support" 
              showArrow 
              onPress={() => openLegalLink('mailto:trainingroom.coach@gmail.com')} 
            />
          </View>
        </View>

        {/* SECTION 4: DANGER ZONE */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.deleteBtn} 
            onPress={() => router.push('/(main)/delete-account')}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// Reusable Helper Component for Rows
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#8E8E93', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    marginLeft: 5, 
    letterSpacing: 1 
  },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 15, 
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
  rowRight: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  iconBox: { 
    width: 34, 
    height: 34, 
    borderRadius: 10, 
    backgroundColor: '#F2F2F7', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  rowTitle: { fontSize: 16, color: '#000', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#8E8E93', marginRight: 8, maxWidth: '70%' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 60 },

  // --- UNIT SELECTOR BOXES ---
  unitContainer: { padding: 15 },
  unitLabel: { fontSize: 13, fontWeight: '700', color: '#8E8E93', marginBottom: 12, textTransform: 'uppercase' },
  unitBoxWrapper: { flexDirection: 'row', gap: 10 },
  unitBox: { 
    flex: 1, 
    height: 50, 
    borderRadius: 12, 
    backgroundColor: '#F2F2F7', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E5E7' 
  },
  unitBoxActive: { backgroundColor: '#c62828', borderColor: '#c62828' },
  unitText: { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
  unitTextActive: { color: '#FFF' },

  // --- DANGER ZONE ---
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FFF', 
    padding: 18, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: '#FF3B30', 
    marginTop: 10 
  },
  deleteBtnText: { color: '#FF3B30', fontWeight: '700', fontSize: 16, marginLeft: 10 },
});