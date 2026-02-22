import { auth, db } from '@/fireBaseConfig';
import { uploadProfileImage } from '@/services/customerServices';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useUser } from './_layout';

const screenWidth = Dimensions.get("window").width;

export default function ProfileScreen() {
  const router = useRouter();
  const { fullName, handle, memberSince, profileImage } = useUser();
  const [uploading, setUploading] = useState(false);
  
  // --- STATES ---
  const [stats, setStats] = useState({
    workoutCount: 0,
    consistency: 0,
    bestRank: '--',
    loading: true
  });

  const [metrics, setMetrics] = useState({
    weight: '--',
    height: '--',
    bodyFat: '--'
  });

  const [weeklyPRs, setWeeklyPRs] = useState<{name: string, weight: number}[]>([]);
  const [chartData, setChartData] = useState<{labels: string[], datasets: {data: number[]}[]}>({
    labels: ["-", "-"],
    datasets: [{ data: [0, 0] }]
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Listen for Body Metrics (Real-time)
    const unsubMetrics = onSnapshot(doc(db, "customers", user.uid, "health", "metrics"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMetrics({
          weight: data.weight ? `${data.weight}kg` : '--',
          height: data.height ? `${data.height}cm` : '--',
          bodyFat: data.bodyFat ? `${data.bodyFat}%` : '--',
        });
      }
    });

    // 2. Fetch Workouts for PRs, Tonnage, and Stats
    const fetchStatsAndHistory = async () => {
      try {
        const workoutsRef = collection(db, "customers", user.uid, "workouts");
        const workoutSnap = await getDocs(query(workoutsRef));

        let completedWorkouts = 0;
        let totalScheduledSets = 0;
        let totalActualSets = 0;
        const prMap: Record<string, number> = {};
        const monthlyTonnage: Record<string, number> = {}; 
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        workoutSnap.forEach((doc) => {
          const data = doc.data();
          const workoutDate = new Date(doc.id); 
          const monthLabel = workoutDate.toLocaleString('default', { month: 'short' });

          if (data.isFinished) completedWorkouts++;

          if (data.exercises) {
            data.exercises.forEach((ex: any) => {
              totalScheduledSets += parseInt(ex.sets) || 0;
              totalActualSets += ex.completedSetsCount || 0;

              if (ex.loggedWeights) {
                ex.loggedWeights.forEach((weightStr: string, index: number) => {
                  const weight = parseFloat(weightStr) || 0;
                  const reps = parseInt(Array.isArray(ex.reps) ? ex.reps[index] : ex.reps) || 0;
                  const setVolume = weight * reps;
                  monthlyTonnage[monthLabel] = (monthlyTonnage[monthLabel] || 0) + setVolume;

                  if (workoutDate >= sevenDaysAgo) {
                    if (!prMap[ex.name] || weight > prMap[ex.name]) prMap[ex.name] = weight;
                  }
                });
              }
            });
          }
        });

        // Set PRs
        setWeeklyPRs(Object.keys(prMap).map(name => ({ name, weight: prMap[name] })));
        
        // Set Graph
        const labels = Object.keys(monthlyTonnage);
        if (labels.length > 0) {
          setChartData({ labels, datasets: [{ data: labels.map(l => monthlyTonnage[l]) }] });
        }

        // Set Main Stats
        setStats({
          workoutCount: completedWorkouts,
          consistency: totalScheduledSets > 0 ? Math.round((totalActualSets / totalScheduledSets) * 100) : 0,
          bestRank: completedWorkouts > 0 ? '#1' : '--',
          loading: false
        });
      } catch (e) {
        console.error(e);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStatsAndHistory();
    return () => unsubMetrics();
  }, []);

  // --- HANDLERS ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied');
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) {
      setUploading(true);
      await uploadProfileImage(auth.currentUser!.uid, result.assets[0].uri);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. PROFILE HEADER */}
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

        {/* 2. STATS BAR */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            {stats.loading ? <ActivityIndicator size="small" color="#c62828" /> : <Text style={styles.statValue}>{stats.workoutCount}</Text>}
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statValue}>{stats.bestRank}</Text>
            <Text style={styles.statLabel}>Best Rank</Text>
          </View>
          <View style={styles.statItem}>
            {stats.loading ? <ActivityIndicator size="small" color="#c62828" /> : <Text style={styles.statValue}>{stats.consistency}%</Text>}
            <Text style={styles.statLabel}>Consistency</Text>
          </View>
        </View>

        {/* 3. BODY METRICS SUMMARY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <TouchableOpacity style={styles.metricsCard} onPress={() => router.push('/(main)/body-metrics')}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{metrics.weight}</Text>
              <Text style={styles.metricLabel}>Weight</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{metrics.height}</Text>
              <Text style={styles.metricLabel}>Height</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{metrics.bodyFat}</Text>
              <Text style={styles.metricLabel}>Body Fat</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* 4. WEEKLY PRs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRs Hit This Week</Text>
          {weeklyPRs.length === 0 ? (
            <View style={styles.emptyPR}><Text style={styles.emptyPRText}>No PRs this week.</Text></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {weeklyPRs.map((pr, i) => (
                <View key={i} style={styles.prCard}>
                  <Ionicons name="trophy" size={18} color="#FFD700" />
                  <Text style={styles.prWeight}>{pr.weight}kg</Text>
                  <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 5. TONNAGE GRAPH */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Volume Tonnage (kg)</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={chartData}
              width={screenWidth - 70}
              height={180}
              yAxisSuffix="k"
              formatYLabel={(v) => `${(parseFloat(v)/1000).toFixed(1)}`}
              chartConfig={{
                backgroundColor: "#FFF",
                backgroundGradientFrom: "#FFF",
                backgroundGradientTo: "#FFF",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(198, 40, 40, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#c62828" }
              }}
              bezier
              fromZero
              style={{ borderRadius: 16, marginTop: 10 }}
            />
          </View>
        </View>

        {/* 6. TRAINING NAVIGATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Details</Text>
          
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/(main)/registered-exercises')}>
            <View style={[styles.optionIconCircle, { backgroundColor: '#FFEBEE' }]}><Ionicons name="list-circle" size={24} color="#c62828" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.optionTitle}>Registered Exercises</Text><Text style={styles.optionSub}>Complete history</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/(main)/workout-history')}>
            <View style={[styles.optionIconCircle, { backgroundColor: '#E3F2FD' }]}><Ionicons name="time" size={24} color="#1976D2" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.optionTitle}>Session History</Text><Text style={styles.optionSub}>Readiness & Tonnage logs</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30 },
  
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, overflow: 'hidden' },
  profilePhoto: { width: 100, height: 100 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c62828', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F2F2F7' },
  userName: { fontSize: 24, fontWeight: '900', color: '#000' },
  userHandle: { fontSize: 15, color: '#888', marginTop: 2 },
  memberSinceText: { fontSize: 13, color: '#AAA', marginTop: 8, fontWeight: '500' },

  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F0F0F0' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#c62828' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  
  metricsCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 18, padding: 18, alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  metricBox: { alignItems: 'center', flex: 1 },
  metricVal: { fontSize: 18, fontWeight: '800', color: '#000' },
  metricLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  metricDivider: { width: 1, height: 25, backgroundColor: '#EEE' },

  prCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginRight: 12, alignItems: 'center', width: 100, elevation: 2 },
  prWeight: { fontSize: 18, fontWeight: '900', color: '#000', marginTop: 5 },
  prName: { fontSize: 11, color: '#666', marginTop: 2 },
  emptyPR: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCC' },
  emptyPRText: { color: '#AAA', fontSize: 13 },

  chartCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },

  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 18, marginBottom: 10, elevation: 1 },
  optionIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  optionSub: { fontSize: 12, color: '#888', marginTop: 2 }
});