import { auth, db } from '@/fireBaseConfig';
import { Exercise, updateGlobalLeaderboard } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from './_layout';

const { width } = Dimensions.get('window');
const GROUP_ORDER = ["Primer", "Power Movements", "Main Lifts", "Accessories"];
const LEADERBOARD_LIST = ["Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", "Deadlift", "Clean", "Snatch", "Hang Clean", "Hang Snatch", "Block Clean", "Block Snatch", "Push Press", "Power Jerk", "Split Jerk", "Trap Bar Deadlift"];

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fullName, unit } = useUser();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  
  const [readiness, setReadiness] = useState(5);
  const [soreness, setSoreness] = useState(1);
  const [sessionMemo, setSessionMemo] = useState('');

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const todayStr = getFormattedStr(new Date());

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, "customers", user.uid, "workouts", todayStr), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExercises(data.exercises || []);
        if (data.isStarted) setShowCheckIn(false);
      } else {
        router.replace('/(main)/(tabs)');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getSupersetColor = (id: string) => {
    const colors = ['#007AFF', '#5856D6', '#AF52DE', '#FF9500', '#FF2D55', '#5AC8FA', '#34C759'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const calculateSessionTonnage = () => {
    let total = 0;
    exercises.forEach(ex => {
      if (ex.loggedWeights && Array.isArray(ex.loggedWeights)) {
        ex.loggedWeights.forEach((weightStr, i) => {
          const weight = parseFloat(weightStr) || 0;
          const reps = parseInt(Array.isArray(ex.reps) ? ex.reps[i] : (ex.reps as any)) || 0;
          total += (weight * reps);
        });
      }
    });
    return total;
  };

  const handleFinishWorkout = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const docRef = doc(db, "customers", user.uid, "workouts", todayStr);
      
      // Update Leaderboard for PRs
      for (const ex of exercises) {
        if (LEADERBOARD_LIST.includes(ex.name) && ex.loggedWeights) {
          const maxWeight = Math.max(...ex.loggedWeights.map(w => parseFloat(w) || 0));
          if (maxWeight > 0) {
            await updateGlobalLeaderboard(user.uid, fullName, ex.name, maxWeight, unit);
          }
        }
      }

      await updateDoc(docRef, {
        isFinished: true,
        finishedAt: new Date(),
        readinessScore: readiness,
        sorenessScore: soreness,
        sessionTonnage: calculateSessionTonnage(),
        sessionMemo: sessionMemo
      });
      setFinishModalVisible(false);
      router.replace('/(main)/(tabs)');
    } catch (error) {
      Alert.alert("Error", "Could not save results.");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;

  if (showCheckIn) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingHorizontal: 30, justifyContent: 'center' }]}>
        <Text style={styles.checkInTitle}>Pre-Workout Check-in</Text>
        <Text style={styles.checkInLabel}>Readiness to train (1-10)</Text>
        <View style={styles.scaleRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <TouchableOpacity key={num} onPress={() => setReadiness(num)} style={[styles.scaleBtn, readiness === num && styles.scaleBtnActive]}>
              <Text style={[styles.scaleText, readiness === num && styles.scaleTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.checkInLabel, { marginTop: 40 }]}>Soreness Level (1-10)</Text>
        <View style={styles.scaleRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <TouchableOpacity key={num} onPress={() => setSoreness(num)} style={[styles.scaleBtn, soreness === num && styles.scaleBtnActive]}>
              <Text style={[styles.scaleText, soreness === num && styles.scaleTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.startActualBtn} onPress={async () => {
          const user = auth.currentUser;
          if (user) await updateDoc(doc(db, "customers", user.uid, "workouts", todayStr), { isStarted: true });
          setShowCheckIn(false);
        }}><Text style={styles.startActualBtnText}>Start Session</Text></TouchableOpacity>
      </View>
    );
  }

  const groupedExercises = exercises.reduce((groups: { [key: string]: Exercise[] }, ex) => {
    const title = ex.groupTitle || "Accessories";
    if (!groups[title]) groups[title] = [];
    groups[title].push(ex);
    return groups;
  }, {});

  const sortedGroupNames = Object.keys(groupedExercises).sort((a, b) => {
    const indexA = GROUP_ORDER.indexOf(a);
    const indexB = GROUP_ORDER.indexOf(b);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}><View style={{ width: 28 }} /><Text style={styles.headerTitle}>ACTIVE SESSION</Text><View style={{ width: 28 }} /></View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sortedGroupNames.map((groupName) => {
          const groupItems = groupedExercises[groupName];
          return (
            <View key={groupName} style={styles.groupContainer}>
              <View style={styles.groupHeaderBox}><Text style={styles.groupHeaderText}>{groupName.toUpperCase()}</Text></View>
              <View style={styles.exercisesListInsideGroup}>
                {groupItems.map((ex, idx) => {
                  const prevItem = groupItems[idx - 1];
                  const nextItem = groupItems[idx + 1];
                  const isDone = ex.loggedWeights && ex.loggedWeights.some(w => w !== '' && w !== null);
                  
                  const hasSuperset = !!ex.supersetId;
                  const isFirstInSS = hasSuperset && (!prevItem || prevItem.supersetId !== ex.supersetId);
                  const isLastInSS = hasSuperset && (!nextItem || nextItem.supersetId !== ex.supersetId);
                  const ssColor = hasSuperset ? getSupersetColor(ex.supersetId!) : 'transparent';

                  return (
                    <TouchableOpacity 
                      key={ex.id} 
                      style={[
                        styles.exerciseRow, 
                        idx === groupItems.length - 1 && { borderBottomWidth: 0 },
                        hasSuperset && { 
                          borderLeftWidth: 2, borderRightWidth: 2, borderColor: ssColor,
                          borderTopWidth: isFirstInSS ? 2 : 0,
                          borderBottomWidth: isLastInSS ? 2 : 0,
                        }
                      ]}
                      onPress={() => router.push({ pathname: '/(main)/log-exercise', params: { exerciseId: ex.id, exerciseName: ex.name, sets: ex.sets } })}
                    >
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exName, isDone && styles.textDone]}>{ex.name}</Text>
                        <Text style={styles.exMeta}>{ex.sets}x{Array.isArray(ex.reps) ? ex.reps.join(',') : ex.reps}{ex.repUnit ? ` ${ex.repUnit}` : ''}</Text>
                      </View>
                      <View style={styles.statusCircle}><Ionicons name={isDone ? "checkmark" : "chevron-forward"} size={18} color="#FFF" /></View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.lineWrapper}><View style={styles.verticalLine} /></View>
            </View>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.finishBtn} onPress={() => setFinishModalVisible(true)}><Text style={styles.finishBtnText}>FINISH WORKOUT</Text></TouchableOpacity>
      </View>

      <Modal visible={finishModalVisible} animationType="fade" transparent={true}>
        <View style={styles.centerModalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.confirmBox}>
              <View style={styles.confirmIconCircle}><Ionicons name="trophy" size={40} color="#c62828" /></View>
              <Text style={styles.confirmTitle}>Workout Options</Text>
              <View style={styles.tonnageBadge}><Text style={styles.tonnageLabel}>TOTAL VOLUME</Text><Text style={styles.tonnageValue}>{calculateSessionTonnage().toLocaleString()} {unit}</Text></View>
              <TextInput style={styles.memoInput} placeholder="How did the session feel?" multiline value={sessionMemo} onChangeText={setSessionMemo} />
              
              <TouchableOpacity style={styles.confirmFinishBtn} onPress={handleFinishWorkout}>
                <Text style={styles.confirmFinishText}>Finish & Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.laterBtn} onPress={() => router.replace('/(main)/(tabs)')}>
                <Text style={styles.laterBtnText}>Complete Later</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setFinishModalVisible(false)}>
                <Text style={{ color: '#666', fontWeight: '600' }}>Keep Lifting</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 1 },
  scrollContent: { padding: 20 },
  groupContainer: { width: '100%', alignItems: 'center' },
  groupHeaderBox: { backgroundColor: '#FFF', width: '100%', paddingVertical: 14, paddingHorizontal: 18, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  groupHeaderText: { fontSize: 13, fontWeight: '900' },
  exercisesListInsideGroup: { backgroundColor: '#FFF', width: '100%', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, overflow: 'hidden', elevation: 2 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  exerciseInfo: { flex: 1 },
  exName: { fontSize: 17, fontWeight: '700' },
  exMeta: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  textDone: { color: '#AAA' },
  statusCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#c62828', justifyContent: 'center', alignItems: 'center' },
  lineWrapper: { height: 35, alignItems: 'center' },
  verticalLine: { width: 2, flex: 1, backgroundColor: '#D1D1D6' },
  footer: { paddingHorizontal: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 10 },
  finishBtn: { backgroundColor: '#000', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  checkInTitle: { fontSize: 26, fontWeight: '900', marginBottom: 40, textAlign: 'center' },
  checkInLabel: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 15, textTransform: 'uppercase' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  scaleBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  scaleBtnActive: { backgroundColor: '#c62828' },
  scaleText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  scaleTextActive: { color: '#FFF' },
  startActualBtn: { backgroundColor: '#c62828', padding: 20, borderRadius: 20, marginTop: 60, width: '100%', alignItems: 'center' },
  startActualBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  confirmBox: { backgroundColor: '#FFF', borderRadius: 25, width: width - 60, padding: 25, alignItems: 'center' },
  confirmIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  confirmFinishBtn: { backgroundColor: '#000', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  
  // FIXED STYLE: Confirm Finish Text
  confirmFinishText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  laterBtn: { backgroundColor: '#F2F2F7', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  laterBtnText: { color: '#000', fontWeight: '600' },
  tonnageBadge: { backgroundColor: '#F9F9FB', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 15, width: '100%' },
  tonnageLabel: { fontSize: 10, fontWeight: '800', color: '#AAA' },
  tonnageValue: { fontSize: 20, fontWeight: '900', color: '#c62828' },
  memoInput: { backgroundColor: '#F9F9FB', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#EEE' }
});