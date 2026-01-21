import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from './_layout';

export default function ProfileScreen() {
  const { fullName, handle, memberSince } = useUser();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. PROFILE HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
            <TouchableOpacity style={styles.editIconBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userHandle}>@{handle}</Text>
          
          {/* Member Since Date */}
          <Text style={styles.memberSinceText}>
            Member since {memberSince || 'Loading...'}
          </Text>
        </View>

        {/* 2. UPDATED ATHLETE STATS BAR */}
        <View style={styles.statsContainer}>
          {/* Workouts */}
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          
          {/* Placeholder */}
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNumber}>--</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
          
          {/* Consistency Work Score */}
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Consistency</Text>
          </View>
        </View>

        {/* 3. SETTINGS SECTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Details</Text>
          <ProfileOption icon="fitness-outline" title="Training Goals" subtitle="Build Muscle" />
          <ProfileOption icon="body-outline" title="Body Metrics" subtitle="Weight, Height" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ProfileOption icon="notifications-outline" title="Notifications" />
          <ProfileOption icon="shield-checkmark-outline" title="Privacy & Security" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Reusable component for the settings rows
function ProfileOption({ icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) {
  return (
    <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
      <View style={styles.optionIconCircle}>
        <Ionicons name={icon} size={22} color="#000" />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarCircle: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  editIconBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#c62828', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F2F2F7',
  },
  userName: { fontSize: 24, fontWeight: '900', color: '#000' },
  userHandle: { fontSize: 15, color: '#888', marginTop: 2 },
  memberSinceText: { fontSize: 13, color: '#AAA', marginTop: 8, fontWeight: '500' },

  // Stats Bar
  statsContainer: { 
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, 
    padding: 20, marginBottom: 30, elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F0F0F0' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#c62828' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 18, marginBottom: 10 },
  optionIconCircle: { width: 40, height: 40, backgroundColor: '#F8F9FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  optionTextContainer: { flex: 1, marginLeft: 15 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  optionSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
});