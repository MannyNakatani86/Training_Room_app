import { auth, db } from '@/fireBaseConfig';
import { uploadProfileImage } from '@/services/customerServices';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, getDocs, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from './_layout';

export default function ProfileScreen() {
  const router = useRouter();
  const { fullName, handle, memberSince, profileImage } = useUser();
  const [uploading, setUploading] = useState(false);
  
  const [workoutCount, setWorkoutCount] = useState(0);
  const [consistency, setConsistency] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const workoutsRef = collection(db, "customers", user.uid, "workouts");
        const querySnapshot = await getDocs(query(workoutsRef));
        let completedWorkouts = 0;
        let totalScheduledSets = 0;
        let totalActualSets = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isFinished === true) completedWorkouts++;
          if (data.exercises && Array.isArray(data.exercises)) {
            data.exercises.forEach((ex: any) => {
              totalScheduledSets += parseInt(ex.sets) || 0;
              totalActualSets += ex.completedSetsCount || 0;
            });
          }
        });

        const consistencyPercent = totalScheduledSets > 0 
          ? Math.round((totalActualSets / totalScheduledSets) * 100) : 0;

        setWorkoutCount(completedWorkouts);
        setConsistency(consistencyPercent > 100 ? 100 : consistencyPercent);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Access required to change photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setUploading(true);
      const user = auth.currentUser;
      if (user) {
        const res = await uploadProfileImage(user.uid, result.assets[0].uri);
        if (!res.success) Alert.alert('Error', 'Upload failed.');
      }
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {uploading ? (
                <ActivityIndicator color="#c62828" size="large" />
              ) : profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profilePhoto} />
              ) : (
                <Ionicons name="person" size={50} color="#666" />
              )}
            </View>
            <TouchableOpacity style={styles.editIconBadge} onPress={pickImage} disabled={uploading}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userHandle}>@{handle}</Text>
          <Text style={styles.memberSinceText}>Member since {memberSince || '...'}</Text>
        </View>

        {/* STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            {loadingStats ? <ActivityIndicator size="small" color="#c62828" /> : <Text style={styles.statNumber}>{workoutCount}</Text>}
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}><Text style={styles.statNumber}>--</Text><Text style={styles.statLabel}>Rank</Text></View>
          <View style={styles.statBox}>
            {loadingStats ? <ActivityIndicator size="small" color="#c62828" /> : <Text style={styles.statNumber}>{consistency}%</Text>}
            <Text style={styles.statLabel}>Consistency</Text>
          </View>
        </View>

        {/* TRAINING DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Details</Text>
          
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/(main)/registered-exercises')}>
            <View style={[styles.optionIconCircle, { backgroundColor: '#FFEBEE' }]}><Ionicons name="list-circle" size={24} color="#c62828" /></View>
            <View style={styles.optionTextContainer}><Text style={styles.optionTitle}>Registered Exercises</Text><Text style={styles.optionSubtitle}>View and sort history</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <ProfileOption icon="fitness-outline" title="Training Goals" subtitle="Build Muscle" />
          <ProfileOption icon="body-outline" title="Body Metrics" subtitle="Weight, Height" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function ProfileOption({ icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) {
  return (
    <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
      <View style={styles.optionIconCircle}><Ionicons name={icon} size={22} color="#000" /></View>
      <View style={styles.optionTextContainer}><Text style={styles.optionTitle}>{title}</Text>{subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}</View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden' },
  profilePhoto: { width: 100, height: 100, borderRadius: 50 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c62828', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F2F2F7' },
  userName: { fontSize: 24, fontWeight: '900', color: '#000' },
  userHandle: { fontSize: 15, color: '#888', marginTop: 2 },
  memberSinceText: { fontSize: 13, color: '#AAA', marginTop: 8, fontWeight: '500' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 30, elevation: 2 },
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