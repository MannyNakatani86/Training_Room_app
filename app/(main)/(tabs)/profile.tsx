import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useUser } from './_layout';

const screenWidth = Dimensions.get("window").width;
const CHART_WIDTH = screenWidth - 40; // Full width minus padding

export default function ProfileScreen() {
  const router = useRouter();
  const { fullName, handle, memberSince, profileImage } = useUser();
  const [uploading, setUploading] = useState(false);
  const [activeGraphIndex, setActiveGraphIndex] = useState(0);
  
  const [stats, setStats] = useState({ workoutCount: 0, consistency: 0, bestRank: '--', loading: true });
  const [metrics, setMetrics] = useState({ weight: '--', height: '--', bodyFat: '--' });
  const [weeklyPRs, setWeeklyPRs] = useState<{name: string, weight: number}[]>([]);

  // --- CHART DATA STATES ---
  const [tonnageData, setTonnageData] = useState({ labels: ["-"], datasets: [{ data: [0] }] });
  const [wellnessData, setWellnessData] = useState({
    labels: ["-"],
    datasets: [
      { data: [0], color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})` }, // Readiness (Green)
      { data: [0], color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})` }  // Soreness (Red)
    ],
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

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

    const fetchWorkoutData = async () => {
      try {
        const workoutsRef = collection(db, "customers", user.uid, "workouts");
        const workoutSnap = await getDocs(query(workoutsRef));

        let completedWorkouts = 0;
        let totalScheduledSets = 0;
        let totalActualSets = 0;
        const prMap: Record<string, number> = {};
        const monthlyTonnage: Record<string, number> = {}; 
        const monthlyReadiness: Record<string, number[]> = {};
        const monthlySoreness: Record<string, number[]> = {};
        
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
                ex.loggedWeights.forEach((w: string, i: number) => {
                  const reps = parseInt(Array.isArray(ex.reps) ? ex.reps[i] : ex.reps) || 0;
                  monthlyTonnage[monthLabel] = (monthlyTonnage[monthLabel] || 0) + ((parseFloat(w) || 0) * reps);
                  if (workoutDate >= sevenDaysAgo && (parseFloat(w) || 0) > (prMap[ex.name] || 0)) prMap[ex.name] = parseFloat(w);
                });
              }
            });
          }
          if (data.readinessScore) {
            if (!monthlyReadiness[monthLabel]) monthlyReadiness[monthLabel] = [];
            monthlyReadiness[monthLabel].push(data.readinessScore);
          }
          if (data.sorenessScore) {
            if (!monthlySoreness[monthLabel]) monthlySoreness[monthLabel] = [];
            monthlySoreness[monthLabel].push(data.sorenessScore);
          }
        });

        // Set Chart States
        const tLabels = Object.keys(monthlyTonnage);
        if (tLabels.length > 0) setTonnageData({ labels: tLabels, datasets: [{ data: tLabels.map(l => monthlyTonnage[l]) }] });

        const wLabels = Object.keys(monthlyReadiness);
        if (wLabels.length > 0) {
          setWellnessData({
            labels: wLabels,
            datasets: [
              { data: wLabels.map(l => { const arr = monthlyReadiness[l]; return arr.reduce((a,b)=>a+b,0)/arr.length; }), color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})` },
              { data: wLabels.map(l => { const arr = monthlySoreness[l]; return arr.reduce((a,b)=>a+b,0)/arr.length; }), color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})` }
            ]
          });
        }

        setWeeklyPRs(Object.keys(prMap).map(name => ({ name, weight: prMap[name] })));
        setStats({
          workoutCount: completedWorkouts,
          consistency: totalScheduledSets > 0 ? Math.round((totalActualSets / totalScheduledSets) * 100) : 0,
          bestRank: completedWorkouts > 0 ? '#1' : '--',
          loading: false
        });
      } catch (e) { console.error(e); }
    };

    fetchWorkoutData();
    return () => unsubMetrics();
  }, []);

  // --- SWIPEABLE GRAPHS CONFIG ---
  const GRAPHS = [
    { id: 'tonnage', title: 'Monthly Tonnage (kg)', data: tonnageData, type: 'tonnage' },
    { id: 'wellness', title: 'Recovery (Green: Readiness | Red: Soreness)', data: wellnessData, type: 'wellness' }
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CHART_WIDTH);
    setActiveGraphIndex(index);
  };

  const renderGraph = ({ item }: { item: any }) => (
    <View style={styles.graphSlide}>
      <Text style={styles.chartTitle}>{item.title}</Text>
      <LineChart
        data={item.data}
        width={CHART_WIDTH - 20}
        height={200}
        fromZero
        bezier
        formatYLabel={(v) => item.type === 'tonnage' ? `${(parseFloat(v)/1000).toFixed(1)}k` : Math.round(parseFloat(v)).toString()}
        chartConfig={{
          backgroundColor: "#FFF",
          backgroundGradientFrom: "#FFF",
          backgroundGradientTo: "#FFF",
          decimalPlaces: 0,
          color: (opacity = 1) => item.type === 'tonnage' ? `rgba(198, 40, 40, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
          propsForDots: { r: "4", strokeWidth: "2", stroke: item.type === 'tonnage' ? "#c62828" : "#000" }
        }}
        style={{ borderRadius: 16, marginTop: 10 }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER & STATS (Identical to before) */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {uploading ? <ActivityIndicator color="#c62828" /> : profileImage ? <Image source={{ uri: profileImage }} style={styles.profilePhoto} /> : <Ionicons name="person" size={50} color="#666" />}
            </View>
            <TouchableOpacity style={styles.editIconBadge}><Ionicons name="camera" size={16} color="#FFF" /></TouchableOpacity>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userHandle}>@{handle}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.workoutCount}</Text><Text style={styles.statLabel}>Workouts</Text></View>
          <View style={[styles.statItem, styles.statBorder]}><Text style={styles.statValue}>{stats.bestRank}</Text><Text style={styles.statLabel}>Best Rank</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.consistency}%</Text><Text style={styles.statLabel}>Consistency</Text></View>
        </View>

        {/* SWIPEABLE CHART SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.chartCard}>
            <FlatList
              data={GRAPHS}
              renderItem={renderGraph}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              keyExtractor={item => item.id}
            />
            {/* Pagination Dots */}
            <View style={styles.dotRow}>
              {GRAPHS.map((_, i) => (
                <View key={i} style={[styles.dot, activeGraphIndex === i ? styles.activeDot : styles.inactiveDot]} />
              ))}
            </View>
          </View>
        </View>

        {/* METRICS, PRs, NAVIGATION (Identical to before) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <TouchableOpacity style={styles.metricsCard} onPress={() => router.push('/(main)/body-metrics')}>
            <View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.weight}</Text><Text style={styles.metricLabel}>Weight</Text></View>
            <View style={styles.metricDivider} /><View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.height}</Text><Text style={styles.metricLabel}>Height</Text></View>
            <View style={styles.metricDivider} /><View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.bodyFat}</Text><Text style={styles.metricLabel}>Body Fat</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRs Hit This Week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {weeklyPRs.map((pr, i) => (
              <View key={i} style={styles.prCard}>
                <Ionicons name="trophy" size={18} color="#FFD700" />
                <Text style={styles.prWeight}>{pr.weight}kg</Text>
                <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

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
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3, overflow: 'hidden' },
  profilePhoto: { width: 100, height: 100 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c62828', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F2F2F7' },
  userName: { fontSize: 24, fontWeight: '900' },
  userHandle: { fontSize: 15, color: '#888', marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F0F0F0' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#c62828' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  
  // SWIPEABLE CHART STYLES
  chartCard: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  graphSlide: { width: CHART_WIDTH, alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 3 },
  activeDot: { width: 20, backgroundColor: '#c62828' },
  inactiveDot: { width: 6, backgroundColor: '#E5E5EA' },

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
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 18, marginBottom: 10 },
  optionIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '600' },
  optionSub: { fontSize: 12, color: '#888', marginTop: 2 }
});