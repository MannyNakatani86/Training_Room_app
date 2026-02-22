import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check-in State
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [readiness, setReadiness] = useState(5);
  const [soreness, setSoreness] = useState(1);

  // Modal States
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [weights, setWeights] = useState<string[]>([]);
  const [allLoggedWeights, setAllLoggedWeights] = useState<Record<string, string[]>>({});

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const todayStr = getFormattedStr(new Date());

  useEffect(() => {
    const fetchTodayWorkout = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docRef = doc(db, "customers", user.uid, "workouts", todayStr);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExercises(docSnap.data().exercises || []);
        } else {
          router.replace('/(main)/(tabs)');
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchTodayWorkout();
  }, []);

  const calculateSessionTonnage = () => {
    let total = 0;
    exercises.forEach(ex => {
        const logged = allLoggedWeights[ex.id];
        if (logged) {
            logged.forEach((w, i) => {
                const weight = parseFloat(w) || 0;
                const reps = parseInt(Array.isArray(ex.reps) ? ex.reps[i] : ex.reps) || 0;
                total += (weight * reps);
            });
        }
    });
    return total;
  };

  const finishWorkoutSession = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const finalTonnage = calculateSessionTonnage();

    try {
      const docRef = doc(db, "customers", user.uid, "workouts", todayStr);
      const updatedExercises = exercises.map(ex => ({
        ...ex,
        completedSetsCount: completedIds.includes(ex.id) ? parseInt(ex.sets) : 0,
        loggedWeights: allLoggedWeights[ex.id] || []
      }));

      await updateDoc(docRef, {
        exercises: updatedExercises,
        isFinished: true,
        finishedAt: new Date(),
        readinessScore: readiness,
        sorenessScore: soreness,
        sessionTonnage: finalTonnage
      });

      setFinishModalVisible(false);
      router.replace('/(main)/(tabs)');
    } catch (error) { Alert.alert("Error", "Could not save results."); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;

  // --- PRE-WORKOUT CHECK-IN ---
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
        <TouchableOpacity style={styles.startActualBtn} onPress={() => setShowCheckIn(false)}>
          <Text style={styles.startActualBtnText}>Start Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>Workout Mode</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Today's Session</Text>
        <Text style={styles.subtitle}>Tap exercises to log progress</Text>

        {exercises.map((ex) => {
          const hasLogs = allLoggedWeights[ex.id] && allLoggedWeights[ex.id].some(w => w !== '');
          return (
            <TouchableOpacity 
              key={ex.id} 
              style={[styles.exerciseCard, hasLogs && styles.cardDone]}
              onPress={() => {
                setActiveExercise(ex);
                setWeights(allLoggedWeights[ex.id] || new Array(parseInt(ex.sets)).fill(''));
                setWeightModalVisible(true);
              }}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.checkCircle, hasLogs && styles.checkCircleDone]}>
                  {hasLogs && <Ionicons name="checkmark" size={20} color="#FFF" />}
                </View>
                <View>
                  <Text style={[styles.exName, hasLogs && styles.textDone]}>{ex.name}</Text>
                  <Text style={styles.exMeta}>{ex.sets} Sets • {Array.isArray(ex.reps) ? ex.reps.join(', ') : ex.reps} Reps</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#c62828" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.finishBtn} onPress={() => setFinishModalVisible(true)}>
          <Text style={styles.finishBtnText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>

      {/* WEIGHT MODAL */}
      <Modal visible={weightModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.modalTitle}>{activeExercise?.name}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {weights.map((w, index) => (
                <View key={index} style={styles.weightRow}>
                  <Text style={styles.setLabel}>Set {index + 1}</Text>
                  <TextInput style={styles.weightInput} placeholder="kg" keyboardType="numeric" value={w} onChangeText={(text) => {
                    const newW = [...weights]; newW[index] = text; setWeights(newW);
                  }} />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveModalBtn} onPress={() => {
              setAllLoggedWeights(prev => ({ ...prev, [activeExercise!.id]: weights }));
              if (!completedIds.includes(activeExercise!.id)) setCompletedIds([...completedIds, activeExercise!.id]);
              setWeightModalVisible(false);
            }}><Text style={styles.saveText}>Complete Exercise</Text></TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* FINISH MODAL */}
      <Modal visible={finishModalVisible} animationType="fade" transparent={true}>
        <View style={styles.centerModalOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}><Ionicons name="trophy" size={40} color="#FFF" /></View>
            <Text style={styles.confirmTitle}>Workout Complete!</Text>
            <View style={styles.tonnageBadge}>
                <Text style={styles.tonnageLabel}>SESSION VOLUME</Text>
                <Text style={styles.tonnageValue}>{calculateSessionTonnage().toLocaleString()} kg</Text>
            </View>
            <Text style={styles.confirmSubtitle}>Ready to save your progress?</Text>
            <TouchableOpacity style={styles.confirmFinishBtn} onPress={finishWorkoutSession}>
              <Text style={styles.confirmFinishText}>FINISH SESSION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#000', textTransform: 'uppercase' },
  scrollContent: { padding: 25 },
  title: { fontSize: 32, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 20, backgroundColor: '#F9F9FB', marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  cardDone: { backgroundColor: '#F2F2F7', opacity: 0.8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  checkCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#DDD', marginRight: 15, alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: '#34C759', borderColor: '#34C759' },
  exName: { fontSize: 18, fontWeight: '700' },
  exMeta: { fontSize: 14, color: '#888', marginTop: 2 },
  textDone: { color: '#AAA' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  finishBtn: { backgroundColor: '#000', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  checkInTitle: { fontSize: 26, fontWeight: '900', marginBottom: 40, textAlign: 'center' },
  checkInLabel: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 15, textTransform: 'uppercase' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  scaleBtnActive: { backgroundColor: '#c62828' },
  scaleText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  scaleTextActive: { color: '#FFF' },
  startActualBtn: { backgroundColor: '#c62828', padding: 20, borderRadius: 20, marginTop: 60, alignItems: 'center' },
  startActualBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#F2F2F7', padding: 15, borderRadius: 15 },
  setLabel: { fontSize: 16, fontWeight: '700', color: '#333' }, // Added this
  weightInput: { backgroundColor: '#FFF', width: 80, padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  saveModalBtn: { backgroundColor: '#c62828', borderRadius: 15, alignItems: 'center', padding: 18, marginTop: 10 },
  saveText: { color: '#FFF', fontWeight: 'bold' },
  confirmBox: { backgroundColor: '#FFF', borderRadius: 25, width: '100%', padding: 25, alignItems: 'center' },
  confirmIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#c62828', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  confirmSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25 },
  confirmFinishBtn: { backgroundColor: '#000', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmFinishText: { color: '#FFF', fontWeight: 'bold' },
  tonnageBadge: { backgroundColor: '#F9F9FB', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20, width: '100%', borderWidth: 1, borderColor: '#EEE' },
  tonnageLabel: { fontSize: 10, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
  tonnageValue: { fontSize: 24, fontWeight: '900', color: '#c62828', marginTop: 5 }
});