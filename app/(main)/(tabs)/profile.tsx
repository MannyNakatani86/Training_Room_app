import { auth, db } from '@/fireBaseConfig';
import { saveMeetResult, updateUsername, uploadProfileImage } from '@/services/customerServices';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useUser } from '../_layout';

const screenWidth = Dimensions.get("window").width;
const CHART_CONTAINER_WIDTH = screenWidth - 40;
type TimeRange = 'week' | 'month' | 'year';

export default function ProfileScreen() {
  const router = useRouter();
  const { fullName, handle, memberSince, profileImage, unit } = useUser();
  
  // UI States
  const [uploading, setUploading] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Pagination for 3 separate graph rows
  const [tonnageIdx, setTonnageIdx] = useState(0);
  const [readinessIdx, setReadinessIdx] = useState(0);
  const [sorenessIdx, setSorenessIdx] = useState(0);

  // Meet Tracker States
  const [meetModalVisible, setMeetModalVisible] = useState(false);
  const [meetType, setMeetType] = useState<'runner' | 'thrower'>('runner');
  const [meetDate, setMeetDate] = useState('');
  const [meetValue, setMeetValue] = useState('');
  const [meetName, setMeetName] = useState('');
  const [recentMeets, setRecentMeets] = useState<any[]>([]);

  // Data States
  const [stats, setStats] = useState({ workoutCount: 0, consistency: 0, bestRank: '--', loading: true });
  const [metrics, setMetrics] = useState({ weight: '--', height: '--' });
  const [weeklyPRs, setWeeklyPRs] = useState<{name: string, weight: number}[]>([]);

  const [chartData, setChartData] = useState<any>({
    tonnage: { week: {labels: ["-"], datasets: [{data:[0]}]}, month: {labels: ["-"], datasets: [{data:[0]}]}, year: {labels: ["-"], datasets: [{data:[0]}]} },
    readiness: { week: {labels: ["-"], datasets: [{data:[0]}]}, month: {labels: ["-"], datasets: [{data:[0]}]}, year: {labels: ["-"], datasets: [{data:[0]}]} },
    soreness: { week: {labels: ["-"], datasets: [{data:[0]}]}, month: {labels: ["-"], datasets: [{data:[0]}]}, year: {labels: ["-"], datasets: [{data:[0]}]} },
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubMetrics = onSnapshot(doc(db, "customers", user.uid, "health", "metrics"), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setMetrics({ weight: `${d.weight}${unit}`, height: `${d.height}cm` });
      }
    });

    const unsubMeets = onSnapshot(query(collection(db, "customers", user.uid, "meets"), orderBy("createdAt", "desc")), (snap) => {
      setRecentMeets(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 3));
    });

    const processData = async () => {
      try {
        const workoutSnap = await getDocs(query(collection(db, "customers", user.uid, "workouts")));
        let allWorkouts: any[] = [];
        workoutSnap.forEach(d => allWorkouts.push({ id: d.id, ...d.data() }));
        allWorkouts.sort((a, b) => a.id.localeCompare(b.id));

        const now = new Date();
        const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const last31Days = new Date(now.getTime() - (31 * 24 * 60 * 60 * 1000));
        const last365Days = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

        const generateChartSet = (filtered: any[], isYear: boolean) => {
          if (isYear) {
            const months: Record<string, any> = {};
            filtered.forEach(w => {
              const m = new Date(w.id).toLocaleString('default', { month: 'short' });
              if (!months[m]) months[m] = { t: 0, r: [], s: [] };
              months[m].t += (w.sessionTonnage || 0);
              if (w.readinessScore) months[m].r.push(w.readinessScore);
              if (w.sorenessScore) months[m].s.push(w.sorenessScore);
            });
            const lbls = Object.keys(months);
            return {
              t: { labels: lbls.length ? lbls : ["-"], datasets: [{ data: lbls.map(l => months[l].t) }] },
              r: { labels: lbls.length ? lbls : ["-"], datasets: [{ data: lbls.map(l => months[l].r.length ? months[l].r.reduce((a:any,b:any)=>a+b)/months[l].r.length : 0) }] },
              s: { labels: lbls.length ? lbls : ["-"], datasets: [{ data: lbls.map(l => months[l].s.length ? months[l].s.reduce((a:any,b:any)=>a+b)/months[l].s.length : 0) }] }
            };
          } else {
            const lbls = filtered.map(w => w.id.split('-')[2]);
            return {
              t: { labels: lbls.length ? lbls : ["-"], datasets: [{ data: filtered.map(w => w.sessionTonnage || 0).length ? filtered.map(w => w.sessionTonnage || 0) : [0] }] },
              r: { labels: lbls.length ? lbls : ["-"], datasets: [{ data: filtered.map(w => w.readinessScore || 0).length ? filtered.map(w => w.readinessScore || 0) : [0] }] },
              s: { labels: lbls.length ? lbls : ["-"], datasets: [{ data: filtered.map(w => w.sorenessScore || 0).length ? filtered.map(w => w.sorenessScore || 0) : [0] }] }
            };
          }
        };

        setChartData({
          tonnage: { 
            week: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last7Days), false).t, 
            month: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last31Days), false).t, 
            year: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last365Days), true).t 
          },
          readiness: { 
            week: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last7Days), false).r, 
            month: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last31Days), false).r, 
            year: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last365Days), true).r 
          },
          soreness: { 
            week: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last7Days), false).s, 
            month: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last31Days), false).s, 
            year: generateChartSet(allWorkouts.filter(w => new Date(w.id) >= last365Days), true).s 
          },
        });

        const prMap: Record<string, number> = {};
        let tSched = 0, tAct = 0, fCount = 0;
        allWorkouts.forEach(w => {
          if (w.isFinished) fCount++;
          w.exercises?.forEach((ex: any) => {
            tSched += parseInt(ex.sets) || 0;
            tAct += ex.completedSetsCount || 0;
            if (new Date(w.id) >= last7Days) {
              ex.loggedWeights?.forEach((wt: string) => { const val = parseFloat(wt); if (val > (prMap[ex.name] || 0)) prMap[ex.name] = val; });
            }
          });
        });
        setWeeklyPRs(Object.keys(prMap).map(name => ({ name, weight: prMap[name] })));
        setStats({ workoutCount: fCount, consistency: tSched > 0 ? Math.round((tAct/tSched)*100) : 0, bestRank: fCount > 0 ? '#1' : '--', loading: false });
      } catch (e) { console.error(e); }
    };
    processData();
    return () => { unsubMetrics(); unsubMeets(); };
  }, [unit]);

  const handleDateInput = (text: string) => {
    if (text.length < meetDate.length) { setMeetDate(text); return; }
    let cleaned = text.replace(/\D/g, ''); 
    let formatted = "";
    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        formatted += '/' + cleaned.slice(2, 4);
        if (cleaned.length > 4) formatted += '/' + cleaned.slice(4, 8);
      }
    }
    setMeetDate(formatted);
  };

  const handleSaveMeet = async () => {
    if (!meetName || !meetValue || !meetDate) return Alert.alert("Error", "Fill all fields");
    const res = await saveMeetResult(auth.currentUser!.uid, { name: meetName, type: meetType, date: meetDate, value: meetValue });
    if (res.success) { setMeetModalVisible(false); setMeetName(''); setMeetValue(''); setMeetDate(''); }
  };

  const handleDeleteMeet = (meetId: string) => {
    Alert.alert("Delete Result", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteDoc(doc(db, "customers", auth.currentUser!.uid, "meets", meetId)); }}
    ]);
  };

  const renderSectionGraph = (type: 'tonnage' | 'readiness' | 'soreness', title: string, color: string, setter: (i: number) => void, activeIdx: number) => {
    const dataArray = [
      { id: 'week', label: 'PAST 7 DAYS', data: chartData[type].week },
      { id: 'month', label: 'PAST 31 DAYS', data: chartData[type].month },
      { id: 'year', label: 'PAST 365 DAYS', data: chartData[type].year },
    ];

    return (
      <View style={styles.chartWrapper}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.chartCard}>
          <FlatList
            data={dataArray}
            horizontal
            pagingEnabled
            onScroll={(e) => setter(Math.round(e.nativeEvent.contentOffset.x / CHART_CONTAINER_WIDTH))}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.graphSlide}>
                <Text style={styles.rangeIndicator}>{item.label}</Text>
                <LineChart
                  data={item.data}
                  width={CHART_CONTAINER_WIDTH - 20}
                  height={190} // Increased for X-axis room
                  fromZero
                  bezier
                  formatYLabel={(v) => type === 'tonnage' && parseFloat(v) >= 1000 ? `${(parseFloat(v)/1000).toFixed(1)}k` : Math.round(parseFloat(v)).toString()}
                  chartConfig={{
                    backgroundColor: "#FFF", backgroundGradientFrom: "#FFF", backgroundGradientTo: "#FFF",
                    decimalPlaces: 0, color: (o = 1) => `${color}${o})`, labelColor: () => '#555',
                  }}
                  style={{ marginBottom: 15 }}
                />
              </View>
            )}
          />
          <View style={styles.dotRow}>
            {[0, 1, 2].map((i) => <View key={i} style={[styles.dot, activeIdx === i ? styles.activeDot : styles.inactiveDot]} />)}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PROFILE HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>{profileImage ? <Image source={{ uri: profileImage }} style={styles.profilePhoto} /> : <Ionicons name="person" size={50} color="#666" />}</View>
            <TouchableOpacity style={styles.editIconBadge} onPress={async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status === 'granted') {
                const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.2 });
                if (!result.canceled) { setUploading(true); await uploadProfileImage(auth.currentUser!.uid, result.assets[0].uri); setUploading(false); }
              }
            }} disabled={uploading}><Ionicons name="camera" size={16} color="#FFF" /></TouchableOpacity>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <TouchableOpacity onPress={() => { setNewUsername(handle); setUsernameModalVisible(true); }}>
            <Text style={styles.userHandle}>@{handle} <Ionicons name="pencil" size={12} color="#AAA" /></Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.workoutCount}</Text><Text style={styles.statLabel}>Workouts</Text></View>
          <View style={[styles.statItem, styles.statBorder]}><Text style={styles.statValue}>{stats.bestRank}</Text><Text style={styles.statLabel}>Best Rank</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{stats.consistency}%</Text><Text style={styles.statLabel}>Consistency</Text></View>
        </View>

        {/* 3 STACKED GRAPHS */}
        {renderSectionGraph('tonnage', `Tonnage (${unit})`, 'rgba(198, 40, 40, ', setTonnageIdx, tonnageIdx)}
        {renderSectionGraph('readiness', 'Training Readiness', 'rgba(52, 199, 89, ', setReadinessIdx, readinessIdx)}
        {renderSectionGraph('soreness', 'Muscle Soreness', 'rgba(255, 149, 0, ', setSorenessIdx, sorenessIdx)}

        {/* BODY METRICS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>
          <TouchableOpacity style={styles.metricsCard} onPress={() => router.push('/(main)/body-metrics')}>
            <View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.weight}</Text><Text style={styles.metricLabel}>Weight</Text></View>
            <View style={styles.metricDivider} /><View style={styles.metricBox}><Text style={styles.metricVal}>{metrics.height}</Text><Text style={styles.metricLabel}>Height</Text></View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* PRs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRs Since Last 7 Days</Text>
          {weeklyPRs.length === 0 ? <View style={styles.emptyPR}><Text style={styles.emptyPRText}>No PRs yet.</Text></View> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>{weeklyPRs.map((pr, i) => (<View key={i} style={styles.prCard}><Ionicons name="trophy" size={18} color="#FFD700" /><Text style={styles.prWeight}>{pr.weight}{unit}</Text><Text style={styles.prName} numberOfLines={1}>{pr.name}</Text></View>))}</ScrollView>
          )}
        </View>

        {/* MEET TRACKER */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Meet Tracker</Text>
            <TouchableOpacity onPress={() => setMeetModalVisible(true)}><Text style={styles.addText}>+ Add Result</Text></TouchableOpacity>
          </View>
          <View style={styles.card}>
            {recentMeets.length === 0 ? <Text style={styles.emptyText}>No results logged.</Text> : recentMeets.map((m, i) => (
              <View key={i} style={styles.meetRow}>
                <View style={{ flex: 1 }}><Text style={styles.meetName}>{m.name}</Text><Text style={styles.meetDate}>{m.date}</Text></View>
                <Text style={styles.meetValue}>{m.value}{m.type === 'thrower' ? 'm' : ''}</Text>
                <TouchableOpacity onPress={() => handleDeleteMeet(m.id)} style={styles.deleteIcon}><Ionicons name="trash-outline" size={18} color="#FF3B30" /></TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* HISTORY NAVIGATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/(main)/registered-exercises')}><View style={[styles.optionIconCircle, { backgroundColor: '#FFEBEE' }]}><Ionicons name="list-circle" size={24} color="#c62828" /></View><View style={{flex:1,marginLeft:15}}><Text style={styles.optionTitle}>Registered Exercises</Text></View><Ionicons name="chevron-forward" size={20} color="#CCC" /></TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push('/(main)/workout-history')}><View style={[styles.optionIconCircle, { backgroundColor: '#E3F2FD' }]}><Ionicons name="time" size={24} color="#1976D2" /></View><View style={{flex:1,marginLeft:15}}><Text style={styles.optionTitle}>Session History</Text></View><Ionicons name="chevron-forward" size={20} color="#CCC" /></TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MEET MODAL */}
      <Modal visible={meetModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Meet Result</Text>
              <View style={styles.typeSelector}>
                  <TouchableOpacity style={[styles.typeBtn, meetType === 'runner' && styles.activeType]} onPress={() => setMeetType('runner')}><Text style={[styles.typeText, meetType === 'runner' && {color:'#FFF'}]}>Runner</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.typeBtn, meetType === 'thrower' && styles.activeType]} onPress={() => setMeetType('thrower')}><Text style={[styles.typeText, meetType === 'thrower' && {color:'#FFF'}]}>Field/Jump</Text></TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>MEET NAME</Text>
              <TextInput style={styles.input} placeholderTextColor="#555" value={meetName} onChangeText={setMeetName} />
              <Text style={styles.inputLabel}>DATE</Text>
              <TextInput style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor="#555" value={meetDate} onChangeText={handleDateInput} keyboardType="numeric" maxLength={10} />
              <Text style={styles.inputLabel}>{meetType === 'runner' ? "RESULT (SECONDS)" : "RESULT (METERS)"}</Text>
              <View style={styles.unitInputContainer}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholderTextColor="#555" value={meetValue} onChangeText={setMeetValue} keyboardType="numeric" />
                <Text style={styles.fixedUnit}>{meetType === 'runner' ? 's' : 'm'}</Text>
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMeet}><Text style={styles.saveText}>Save Result</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setMeetModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* USERNAME MODAL */}
      <Modal visible={usernameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.editBox}><Text style={styles.editTitle}>Update Username</Text><TextInput style={styles.editInput} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" /><TouchableOpacity style={styles.saveBtn} onPress={async () => { if(!newUsername) return; setIsUpdatingUsername(true); const res = await updateUsername(auth.currentUser!.uid, newUsername); if(res.success) setUsernameModalVisible(false); else Alert.alert("Error", res.error); setIsUpdatingUsername(false); }} disabled={isUpdatingUsername}>{isUpdatingUsername ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save Username</Text>}</TouchableOpacity><TouchableOpacity onPress={() => setUsernameModalVisible(false)}><Text style={{marginTop:15,color:'#666'}}>Cancel</Text></TouchableOpacity></View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 30 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3, overflow: 'hidden' },
  profilePhoto: { width: 90, height: 90 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c62828', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F2F2F7' },
  userName: { fontSize: 22, fontWeight: '900', marginTop: 10 },
  userHandle: { fontSize: 14, color: '#888' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#EEE' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#c62828' },
  statLabel: { fontSize: 11, color: '#888' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
  
  chartWrapper: { marginBottom: 25 },
  chartCard: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 20, elevation: 2 },
  graphSlide: { width: CHART_CONTAINER_WIDTH, alignItems: 'center' },
  rangeIndicator: { fontSize: 10, fontWeight: '900', color: '#AAA', marginBottom: 10 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { height: 4, width: 4, borderRadius: 2, marginHorizontal: 2 },
  activeDot: { width: 12, backgroundColor: '#c62828' },
  inactiveDot: { backgroundColor: '#EEE' },

  metricsCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 18, padding: 18, alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  metricBox: { alignItems: 'center', flex: 1 },
  metricVal: { fontSize: 17, fontWeight: '800' },
  metricLabel: { fontSize: 11, color: '#888' },
  metricDivider: { width: 1, height: 20, backgroundColor: '#EEE' },
  
  prCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginRight: 12, alignItems: 'center', width: 100, elevation: 2 },
  prWeight: { fontSize: 16, fontWeight: '900', marginTop: 5 },
  prName: { fontSize: 10, color: '#666' },
  emptyPR: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCC' },
  emptyPRText: { color: '#AAA', fontSize: 12 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addText: { color: '#c62828', fontWeight: 'bold', fontSize: 11, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, elevation: 1 },
  meetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  meetName: { fontSize: 14, fontWeight: '700' },
  meetDate: { fontSize: 11, color: '#888' },
  meetValue: { fontSize: 15, fontWeight: '900', color: '#c62828' },
  deleteIcon: { padding: 5 },
  emptyText: { textAlign: 'center', color: '#AAA', fontSize: 12 },

  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 18, marginBottom: 10, elevation: 1 },
  optionIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  optionTitle: { fontSize: 15, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center' },
  activeType: { backgroundColor: '#000' },
  typeText: { fontWeight: 'bold', fontSize: 11, color: '#888' },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16, color: '#000', fontWeight: '600' },
  unitInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, paddingRight: 15, marginBottom: 20 },
  fixedUnit: { fontSize: 16, fontWeight: '900', color: '#c62828' },
  
  saveBtn: { backgroundColor: '#c62828', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }, // Added back
  cancelText: { textAlign: 'center', marginTop: 15, color: '#888', fontSize: 13 },
  
  editBox: { backgroundColor: '#FFF', width: '80%', padding: 25, borderRadius: 20, alignItems: 'center' },
  editTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  editInput: { backgroundColor: '#F2F2F7', width: '100%', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  saveUsernameBtn: { backgroundColor: '#c62828', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
});