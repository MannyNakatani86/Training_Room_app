import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
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

const { width } = Dimensions.get('window');
const GROUP_ORDER = ["Primer", "Main Lifts", "Power Movements", "Accessories"];

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);

  const [readiness, setReadiness] = useState(5);
  const [soreness, setSoreness] = useState(1);
  const [sessionMemo, setSessionMemo] = useState('');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [weights, setWeights] = useState<string[]>([]);

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
        // SKIP CHECK-IN if already started
        if (data.isStarted) {
          setShowCheckIn(false);
        }
      } else {
        router.replace('/(main)/(tabs)');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const startWorkout = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, "customers", user.uid, "workouts", todayStr), {
        isStarted: true
      });
    }
    setShowCheckIn(false);
  };

  const calculateSessionTonnage = () => {
    let total = 0;
    exercises.forEach(ex => {
      if (ex.loggedWeights) {
        ex.loggedWeights.forEach((w, i) => {
          total += (parseFloat(w) || 0) * (parseInt(Array.isArray(ex.reps) ? ex.reps[i] : ex.reps) || 0);
        });
      }
    });
    return total;
  };

  const finishWorkoutSession = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, "customers", user.uid, "workouts", todayStr), {
        isFinished: true,
        finishedAt: new Date(),
        readinessScore: readiness,
        sorenessScore: soreness,
        sessionTonnage: calculateSessionTonnage(),
        sessionMemo: sessionMemo
      });
      setFinishModalVisible(false);
      router.replace('/(main)/(tabs)');
    } catch (error) { Alert.alert("Error", "Could not save."); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;

  if (showCheckIn) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingHorizontal: 30, justifyContent: 'center' }]}>
        <Text style={styles.checkInTitle}>Pre-Workout Check-in</Text>
        <Text style={styles.checkInLabel}>How ready do you feel to train? (1-10)</Text>
        <View style={styles.scaleRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <TouchableOpacity key={num} onPress={() => setReadiness(num)} style={[styles.scaleBtn, readiness === num && styles.scaleBtnActive]}>
              <Text style={[styles.scaleText, readiness === num && styles.scaleTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.checkInLabel, { marginTop: 40 }]}>Muscle Soreness Level? (1-10)</Text>
        <View style={styles.scaleRow}>
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <TouchableOpacity key={num} onPress={() => setSoreness(num)} style={[styles.scaleBtn, soreness === num && styles.scaleBtnActive]}>
              <Text style={[styles.scaleText, soreness === num && styles.scaleTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.startActualBtn} onPress={startWorkout}>
          <Text style={styles.startActualBtnText}>Start Session</Text>
        </TouchableOpacity>
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
        {sortedGroupNames.map((groupName) => (
          <View key={groupName} style={styles.groupContainer}>
            <View style={styles.groupHeaderBox}><Text style={styles.groupHeaderText}>{groupName.toUpperCase()}</Text></View>
            <View style={styles.exercisesListInsideGroup}>
              {groupedExercises[groupName].map((ex, idx) => {
                const isDone = ex.loggedWeights && ex.loggedWeights.some(w => w !== '' && w !== null);
                return (
                  <TouchableOpacity key={ex.id} style={[styles.exerciseRow, idx === groupedExercises[groupName].length - 1 && { borderBottomWidth: 0 }]} onPress={() => router.push({ pathname: '/(main)/log-exercise', params: { exerciseId: ex.id, exerciseName: ex.name, sets: ex.sets } })}>
                    <View style={styles.exerciseInfo}><Text style={[styles.exName, isDone && styles.textDone]}>{ex.name}</Text><Text style={styles.exMeta}>{ex.sets} Sets • {Array.isArray(ex.reps) ? ex.reps.join(', ') : ex.reps} Reps</Text></View>
                    <View style={styles.statusCircle}><Ionicons name={isDone ? "checkmark" : "chevron-forward"} size={18} color="#FFF" /></View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
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
              <View style={styles.tonnageBadge}><Text style={styles.tonnageLabel}>VOLUME</Text><Text style={styles.tonnageValue}>{calculateSessionTonnage().toLocaleString()} kg</Text></View>
              <TextInput style={styles.memoInput} placeholder="Session notes..." multiline value={sessionMemo} onChangeText={setSessionMemo} />
              
              <TouchableOpacity style={styles.confirmFinishBtn} onPress={finishWorkoutSession}><Text style={styles.confirmFinishText}>Finish & Save</Text></TouchableOpacity>
              <TouchableOpacity style={styles.laterBtn} onPress={() => router.replace('/(main)/(tabs)')}><Text style={styles.laterBtnText}>Complete Later</Text></TouchableOpacity>
              <TouchableOpacity style={{marginTop: 10}} onPress={() => setFinishModalVisible(false)}><Text style={{color: '#666'}}>Keep Lifting</Text></TouchableOpacity>
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
  groupContainer: { width: '100%', marginBottom: 20 },
  groupHeaderBox: { backgroundColor: '#FFF', padding: 14, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  groupHeaderText: { fontSize: 13, fontWeight: '900' },
  exercisesListInsideGroup: { backgroundColor: '#FFF', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, paddingHorizontal: 18 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  exerciseInfo: { flex: 1 },
  exName: { fontSize: 17, fontWeight: '700' },
  exMeta: { fontSize: 13, color: '#888', marginTop: 4 },
  textDone: { color: '#AAA' },
  statusCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#c62828', justifyContent: 'center', alignItems: 'center' },
  footer: { paddingHorizontal: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 10 },
  finishBtn: { backgroundColor: '#000', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
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
  confirmFinishBtn: { backgroundColor: '#c62828', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  confirmFinishText: { color: '#FFF', fontWeight: 'bold' },
  laterBtn: { backgroundColor: '#F2F2F7', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  laterBtnText: { color: '#000', fontWeight: '600' },
  tonnageBadge: { backgroundColor: '#F9F9FB', padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 15, width: '100%' },
  tonnageLabel: { fontSize: 10, fontWeight: '800', color: '#AAA' },
  tonnageValue: { fontSize: 20, fontWeight: '900', color: '#c62828' },
  memoInput: { backgroundColor: '#F9F9FB', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 60, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#EEE' }
});