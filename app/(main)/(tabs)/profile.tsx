import { auth, db } from '@/fireBaseConfig';
import { updateUsername, uploadProfileImage } from '@/services/customerServices';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useUser } from './_layout';

const screenWidth = Dimensions.get("window").width;
const CHART_WIDTH = screenWidth - 40;
type TimeRange = 'week' | 'month' | 'year';

export default function ProfileScreen() {
  const router = useRouter();
  const { fullName, handle, memberSince, profileImage } = useUser();
  
  // UI States
  const [uploading, setUploading] = useState(false);
  const [activeGraphIndex, setActiveGraphIndex] = useState(0);
  const [range, setRange] = useState<TimeRange>('week');
  
  // Username Change States
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Data States
  const [stats, setStats] = useState({ workoutCount: 0, consistency: 0, bestRank: '--', loading: true });
  const [metrics, setMetrics] = useState({ weight: '--', height: '--', bodyFat: '--' });
  const [weeklyPRs, setWeeklyPRs] = useState<{name: string, weight: number}[]>([]);
  const [tonnageData, setTonnageData] = useState({ labels: ["-"], datasets: [{ data: [0] }] });
  const [wellnessData, setWellnessData] = useState({
    labels: ["-"],
    datasets: [{ data: [0], color: (o=1) => `rgba(52, 199, 89, ${o})` }, { data: [0], color: (o=1) => `rgba(255, 59, 48, ${o})` }]
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveGraphIndex(Math.round(event.nativeEvent.contentOffset.x / CHART_WIDTH));
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Body Metrics Listener
    const unsubMetrics = onSnapshot(doc(db, "customers", user.uid, "health", "metrics"), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setMetrics({ weight: `${d.weight}kg`, height: `${d.height}cm`, bodyFat: `${d.bodyFat}%` });
      }
    });

    // 2. Fetch and Process Workout Data for Stats/Graphs/PRs
    const fetchAndProcess = async () => {
      try {
        const workoutSnap = await getDocs(query(collection(db, "customers", user.uid, "workouts")));
        let allWorkouts: any[] = [];
        workoutSnap.forEach(d => allWorkouts.push({ id: d.id, ...d.data() }));
        allWorkouts.sort((a, b) => a.id.localeCompare(b.id));

        const now = new Date();
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const filtered = allWorkouts.filter(w => {
          const d = new Date(w.id);
          if (range === 'week') return d >= startOfWeek;
          if (range === 'month') return d >= startOfMonth;
          return d >= startOfYear;
        });

        let labels: string[] = [];
        let tonnages: number[] = [];
        let readiness: number[] = [];
        let soreness: number[] = [];

        if (range === 'year') {
          const months: Record<string, any> = {};
          filtered.forEach(w => {
            const m = new Date(w.id).toLocaleString('default', { month: 'short' });
            if (!months[m]) months[m] = { vol: 0, r: [], s: [] };
            months[m].vol += (w.sessionTonnage || 0);
            if (w.readinessScore) months[m].r.push(w.readinessScore);
            if (w.sorenessScore) months[m].s.push(w.sorenessScore);
          });
          labels = Object.keys(months);
          tonnages = labels.map(l => months[l].vol);
          readiness = labels.map(l => months[l].r.length ? months[l].r.reduce((a:any,b:any)=>a+b)/months[l].r.length : 0);
          soreness = labels.map(l => months[l].s.length ? months[l].s.reduce((a:any,b:any)=>a+b)/months[l].s.length : 0);
        } else {
          labels = filtered.map(w => w.id.split('-')[2]);
          tonnages = filtered.map(w => w.sessionTonnage || 0);
          readiness = filtered.map(w => w.readinessScore || 0);
          soreness = filtered.map(w => w.sorenessScore || 0);
        }

        setTonnageData({ labels: labels.length ? labels : ["-"], datasets: [{ data: tonnages.length ? tonnages : [0] }] });
        setWellnessData({
          labels: labels.length ? labels : ["-"],
          datasets: [
            { data: readiness.length ? readiness : [0], color: (o=1) => `rgba(52, 199, 89, ${o})` },
            { data: soreness.length ? soreness : [0], color: (o=1) => `rgba(255, 59, 48, ${o})` }
          ]
        });

        // Stats & PRs
        const prMap: Record<string, number> = {};
        let tSched = 0, tAct = 0, fCount = 0;
        allWorkouts.forEach(w => {
          if (w.isFinished) fCount++;
          w.exercises?.forEach((ex: any) => {
            tSched += parseInt(ex.sets) || 0;
            tAct += ex.completedSetsCount || 0;
            if (new Date(w.id) >= new Date(now.getTime() - 7*24*60*60*1000)) {
              ex.loggedWeights?.forEach((wt: string) => { if (parseFloat(wt) > (prMap[ex.name] || 0)) prMap[ex.name] = parseFloat(wt); });
            }
          });
        });
        setWeeklyPRs(Object.keys(prMap).map(name => ({ name, weight: prMap[name] })));
        setStats({ workoutCount: fCount, consistency: tSched > 0 ? Math.round((tAct/tSched)*100) : 0, bestRank: fCount > 0 ? '#1' : '--', loading: false });
      } catch (e) { console.error(e); }
    };
    fetchAndProcess();
    return () => unsubMetrics();
  }, [range]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied');
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.2 });
    if (!result.canceled) {
      setUploading(true);
      await uploadProfileImage(auth.currentUser!.uid, result.assets[0].uri);
      setUploading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return;
    setIsUpdatingUsername(true);
    const res = await updateUsername(auth.currentUser!.uid, newUsername);
    if (res.success) {
      Alert.alert("Success", "Username updated!");
      setUsernameModalVisible(false);
    } else {
      Alert.alert("Error", res.error);
    }
    setIsUpdatingUsername(false);
  };

  const renderGraph = ({ item }: { item: any }) => (
    <View style={styles.graphSlide}>
      <Text style={styles.chartTitle}>{item.title}</Text>
      <LineChart
        data={item.data}
        width={CHART_WIDTH - 20}
        height={180}
        fromZero
        bezier
        formatYLabel={(v) => item.type === 'tonnage' ? (parseFloat(v) >= 1000 ? `${(parseFloat(v)/1000).toFixed(1)}k` : v) : Math.round(parseFloat(v)).toString()}
        chartConfig={{
          backgroundColor: "#FFF", backgroundGradientFrom: "#FFF", backgroundGradientTo: "#FFF",
          decimalPlaces: 0, color: (o = 1) => item.type === 'tonnage' ? `rgba(198, 40, 40, ${o})` : `rgba(0, 0, 0, ${o})`,
          labelColor: (o = 1) => `rgba(100, 100, 100, ${o})`, propsForDots: { r: "4", strokeWidth: "2", stroke: item.type === 'tonnage' ? "#c62828" : "#000" }
        }}
        style={{ borderRadius: 16, marginTop: 10 }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {uploading ? <ActivityIndicator color="#c62828" /> : profileImage ? <Image source={{ uri: profileImage }} style={styles.profilePhoto} /> : <Ionicons name="person" size={50} color="#666" />}
            </View>
            <TouchableOpacity style={styles.editIconBadge} onPress={pickImage} disabled={uploading}><Ionicons name="camera" size={16} color="#FFF" /></TouchableOpacity>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <TouchableOpacity onPress={() => { setNewUsername(handle); setUsernameModalVisible(true); }}>
            <Text style={styles.userHandle}>@{handle} <Ionicons name="pencil" size={12} color="#AAA" /></Text>
          </TouchableOpacity>
          <Text style={styles.memberSinceText}>Member since {memberSince || '...'}</Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.workoutCount}</Text><Text style={styles.statLabel}>Workouts</Text></View>
          <View style={[styles.statItem, styles.statBorder]}><Text style={styles.statValue}>{stats.bestRank}</Text><Text style={styles.statLabel}>Best Rank</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.consistency}%</Text><Text style={styles.statLabel}>Consistency</Text></View>
        </View>

        {/* BODY METRICS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <TouchableOpacity style={styles.metricsCard} onPress={() => router.push('/(main)/body-metrics')}>
            <View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.weight}</Text><Text style={styles.metricLabel}>Weight</Text></View>
            <View style={styles.metricDivider} /><View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.height}</Text><Text style={styles.metricLabel}>Height</Text></View>
            <View style={styles.metricDivider} /><View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.bodyFat}</Text><Text style={styles.metricLabel}>Body Fat</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* SWIPEABLE GRAPHS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.chartCard}>
            <View style={styles.rangeSelector}>
              {(['week', 'month', 'year'] as TimeRange[]).map((r) => (
                <TouchableOpacity key={r} onPress={() => setRange(r)} style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}>
                  <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <FlatList data={[{ id:'t', title:'Total Volume (kg)', data:tonnageData, type:'tonnage'}, { id:'w', title:'Readiness vs Soreness', data:wellnessData, type:'wellness'}]} renderItem={renderGraph} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleScroll} keyExtractor={item => item.id} />
            <View style={styles.dotRow}>{[0, 1].map((i) => (<View key={i} style={[styles.dot, activeGraphIndex === i ? styles.activeDot : styles.inactiveDot]} />))}</View>
          </View>
        </View>

        {/* WEEKLY PRs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRs Hit This Week</Text>
          {weeklyPRs.length === 0 ? <View style={styles.emptyPR}><Text style={styles.emptyPRText}>No PRs this week.</Text></View> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>{weeklyPRs.map((pr, i) => (<View key={i} style={styles.prCard}><Ionicons name="trophy" size={18} color="#FFD700" /><Text style={styles.prWeight}>{pr.weight}kg</Text><Text style={styles.prName} numberOfLines={1}>{pr.name}</Text></View>))}</ScrollView>
          )}
        </View>

        {/* NAVIGATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/(main)/registered-exercises')}>
            <View style={[styles.optionIconCircle, { backgroundColor: '#FFEBEE' }]}><Ionicons name="list-circle" size={24} color="#c62828" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.optionTitle}>Registered Exercises</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/(main)/workout-history')}>
            <View style={[styles.optionIconCircle, { backgroundColor: '#E3F2FD' }]}><Ionicons name="time" size={24} color="#1976D2" /></View>
            <View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.optionTitle}>Session History</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* USERNAME MODAL */}
      <Modal visible={usernameModalVisible} transparent animationType="fade">
        <View style={styles.centerModalOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Update Username</Text>
            <TextInput style={styles.editInput} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" />
            <TouchableOpacity style={styles.saveUsernameBtn} onPress={handleUpdateUsername} disabled={isUpdatingUsername}>
              {isUpdatingUsername ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveUsernameText}>Save Username</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setUsernameModalVisible(false)}><Text style={{ marginTop: 15, color: '#666' }}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  memberSinceText: { fontSize: 13, color: '#AAA', marginTop: 5 },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F0F0F0' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#c62828' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  chartCard: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 20, elevation: 3 },
  rangeSelector: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  rangeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F2F2F7' },
  rangeBtnActive: { backgroundColor: '#000' },
  rangeText: { fontSize: 10, fontWeight: '800', color: '#888' },
  rangeTextActive: { color: '#FFF' },
  graphSlide: { width: CHART_WIDTH, alignItems: 'center' },
  chartTitle: { fontSize: 13, fontWeight: '700', color: '#333' },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  dot: { height: 6, borderRadius: 3, marginHorizontal: 3 },
  activeDot: { width: 20, backgroundColor: '#c62828' },
  inactiveDot: { width: 6, backgroundColor: '#E5E5EA' },
  metricsCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 18, padding: 18, alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  metricBox: { alignItems: 'center', flex: 1 },
  metricVal: { fontSize: 18, fontWeight: '800' },
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
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  editBox: { backgroundColor: '#FFF', width: '80%', padding: 25, borderRadius: 20, alignItems: 'center' },
  editTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  editInput: { backgroundColor: '#F2F2F7', width: '100%', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  saveUsernameBtn: { backgroundColor: '#c62828', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveUsernameText: { color: '#FFF', fontWeight: 'bold' }
});