import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GROUP_ORDER = ["Primer", "Main Lifts", "Power Movements", "Accessories"];

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Workflow States
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  
  // Check-in Values
  const [readiness, setReadiness] = useState(5);
  const [soreness, setSoreness] = useState(1);

  // Timezone-safe date helper
  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const todayStr = getFormattedStr(new Date());

  // 1. Fetch Data with Real-time listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(doc(db, "customers", user.uid, "workouts", todayStr), (docSnap) => {
      if (docSnap.exists()) {
        setExercises(docSnap.data().exercises || []);
      } else {
        router.replace('/(main)/(tabs)');
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Logic: Group and Sort Exercises
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

  // 3. Logic: Calculate Total Session Tonnage
  const calculateSessionTonnage = () => {
    let total = 0;
    exercises.forEach(ex => {
      if (ex.loggedWeights && Array.isArray(ex.loggedWeights)) {
        ex.loggedWeights.forEach((weightStr, i) => {
          const weight = parseFloat(weightStr) || 0;
          const reps = parseInt(Array.isArray(ex.reps) ? ex.reps[i] : ex.reps) || 0;
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
      await updateDoc(docRef, {
        isFinished: true,
        finishedAt: new Date(),
        readinessScore: readiness,
        sorenessScore: soreness,
        sessionTonnage: calculateSessionTonnage()
      });

      setFinishModalVisible(false);
      router.replace('/(main)/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save workout results.");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;

  // --- VIEW 1: PRE-WORKOUT CHECK-IN ---
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

  // --- VIEW 2: ACTIVE SESSION LIST ---
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER (No X button, centered title) */}
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>ACTIVE SESSION</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sortedGroupNames.map((groupName, gIndex) => (
          <View key={groupName} style={styles.groupContainer}>
            
            <View style={styles.groupHeaderBox}>
              <Text style={styles.groupHeaderText}>{groupName.toUpperCase()}</Text>
              <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={18} color="#AAA" /></TouchableOpacity>
            </View>

            <View style={styles.exercisesListInsideGroup}>
              {groupedExercises[groupName].map((ex, exIndex) => {
                // Check if weights have been logged for this exercise
                const isDone = ex.loggedWeights && ex.loggedWeights.some(w => w !== '' && w !== null);
                
                return (
                  <TouchableOpacity 
                    key={ex.id} 
                    style={[styles.exerciseRow, exIndex === groupedExercises[groupName].length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => router.push({
                      pathname: '/(main)/log-exercise',
                      params: { exerciseId: ex.id, exerciseName: ex.name, sets: ex.sets }
                    })}
                  >
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exName, isDone && styles.textDone]}>{ex.name}</Text>
                      <Text style={styles.exMeta}>
                        {ex.sets} Sets • {Array.isArray(ex.reps) ? ex.reps.join(', ') : ex.reps} Reps
                      </Text>
                    </View>

                    {/* COMPANY COLOR NAVIGATION CIRCLE */}
                    <View style={styles.statusCircle}>
                      <Ionicons 
                        name={isDone ? "checkmark" : "chevron-forward"} 
                        size={18} 
                        color="#FFF" 
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {gIndex < sortedGroupNames.length - 1 && (
              <View style={styles.lineWrapper}><View style={styles.verticalLine} /></View>
            )}
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.finishBtn} onPress={() => setFinishModalVisible(true)}>
          <Text style={styles.finishBtnText}>FINISH WORKOUT</Text>
        </TouchableOpacity>
      </View>

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

            <TouchableOpacity style={styles.confirmFinishBtn} onPress={handleFinishWorkout}>
              <Text style={styles.confirmFinishText}>FINISH SESSION</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setFinishModalVisible(false)}>
              <Text style={{ color: '#666', fontWeight: '600' }}>KEEP LIFTING</Text>
            </TouchableOpacity>
          </View>
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
  groupHeaderBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', width: '100%', paddingVertical: 14, paddingHorizontal: 18, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  groupHeaderText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  exercisesListInsideGroup: { backgroundColor: '#FFF', width: '100%', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, paddingHorizontal: 18, marginBottom: 5, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  exerciseInfo: { flex: 1 },
  exName: { fontSize: 17, fontWeight: '700', color: '#000' },
  exMeta: { fontSize: 13, color: '#8E8E93', marginTop: 4, fontWeight: '500' },
  textDone: { color: '#AAA' },
  statusCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#c62828', justifyContent: 'center', alignItems: 'center' },
  lineWrapper: { height: 35, alignItems: 'center' },
  verticalLine: { width: 2, flex: 1, backgroundColor: '#D1D1D6' },
  footer: { paddingHorizontal: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 10 },
  finishBtn: { backgroundColor: '#000', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  // Check-in Styles
  checkInTitle: { fontSize: 26, fontWeight: '900', marginBottom: 40, textAlign: 'center' },
  checkInLabel: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 15, textTransform: 'uppercase' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  scaleBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  scaleBtnActive: { backgroundColor: '#c62828' },
  scaleText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  scaleTextActive: { color: '#FFF' },
  startActualBtn: { backgroundColor: '#c62828', padding: 20, borderRadius: 20, marginTop: 60, width: '100%', alignItems: 'center' },
  startActualBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Modal
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
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