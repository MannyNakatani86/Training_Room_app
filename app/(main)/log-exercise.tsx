import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LogExerciseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 1. Params passed from Active Workout list
  const { exerciseId, exerciseName, sets } = useLocalSearchParams<{ 
    exerciseId: string; 
    exerciseName: string; 
    sets: string;
  }>();
  
  const [weights, setWeights] = useState<string[]>([]);
  const [repsArray, setRepsArray] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(true);

  // Timezone-safe date helper
  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const todayStr = getFormattedStr(new Date());

  useEffect(() => {
    const loadCurrentData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "customers", user.uid, "workouts", todayStr);
        const docSnap = await getDoc(docRef);
        
        const numSets = parseInt(sets || '0');
        let initialWeights = new Array(numSets).fill('');
        let targetReps = new Array(numSets).fill('0');
        let initialMemo = '';

        if (docSnap.exists()) {
          const exercises: Exercise[] = docSnap.data().exercises || [];
          const currentEx = exercises.find((e) => e.id === exerciseId);
          
          if (currentEx) {
            if (currentEx.loggedWeights && currentEx.loggedWeights.length > 0) {
              initialWeights = currentEx.loggedWeights;
            }
            if (currentEx.reps && Array.isArray(currentEx.reps)) {
              targetReps = currentEx.reps;
            }
            initialMemo = currentEx.memo || '';
          }
        }
        
        setWeights(initialWeights);
        setRepsArray(targetReps);
        setMemo(initialMemo);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentData();
  }, [exerciseId, sets]);

  // --- NEW FEATURE: FILL ALL WEIGHTS ---
  const fillAllWeights = () => {
    const firstWeight = weights[0];
    if (!firstWeight) return; 
    setWeights(new Array(weights.length).fill(firstWeight));
  };

  const saveAndGoBack = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, "customers", user.uid, "workouts", todayStr);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const exercises: Exercise[] = docSnap.data().exercises || [];
        const updatedExercises = exercises.map((ex) => 
          ex.id === exerciseId ? { ...ex, loggedWeights: weights, memo: memo } : ex
        );
        
        await updateDoc(docRef, { exercises: updatedExercises });
        router.back();
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#c62828" size="large" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LOG SESSION</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.exerciseTitle}>{exerciseName}</Text>
          <Text style={styles.targetText}>{sets} Sets Planned</Text>

          {/* ACTION BUTTONS */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="videocam" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#000' }]}
              onPress={() => router.push({ 
                pathname: '/(main)/exercise-history', 
                params: { exerciseName: exerciseName as string } 
              })}
            >
              <Ionicons name="time" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>History</Text>
            </TouchableOpacity>
          </View>

          {/* WEIGHT LOGGING SECTION */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>LOG YOUR SETS (KG)</Text>
                {/* THE "ALL" BUTTON */}
                <TouchableOpacity style={styles.allBtn} onPress={fillAllWeights}>
                    <Text style={styles.allBtnText}>USE SET 1 FOR ALL</Text>
                </TouchableOpacity>
            </View>

            {weights.map((w, index) => (
              <View key={index} style={styles.setRow}>
                <View>
                  <Text style={styles.setLabel}>SET {index + 1}</Text>
                  <Text style={styles.targetRepsLabel}>Target: {repsArray[index] || '0'} reps</Text>
                </View>
                <TextInput 
                  style={styles.weightInput}
                  keyboardType="numeric"
                  placeholder="kg"
                  value={w}
                  onChangeText={(text) => {
                    const newW = [...weights];
                    newW[index] = text;
                    setWeights(newW);
                  }}
                />
              </View>
            ))}
          </View>

          {/* MEMO SECTION */}
          <View style={styles.section}>
            <Text style={styles.label}>MEMO / NOTES</Text>
            <TextInput 
              style={styles.memoInput} 
              placeholder="How did it feel?..." 
              multiline 
              value={memo} 
              onChangeText={setMemo} 
            />
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveAndGoBack}>
          <Text style={styles.saveBtnText}>Save Exercise</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { padding: 25 },
  exerciseTitle: { fontSize: 32, fontWeight: '900', color: '#000' },
  targetText: { fontSize: 16, color: '#666', marginTop: 5, marginBottom: 25 },
  
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  actionBtn: { flex: 1, backgroundColor: '#c62828', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold' },

  section: { marginBottom: 30 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '800', color: '#AAA', letterSpacing: 1 },
  allBtn: { backgroundColor: '#F2F2F7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  allBtnText: { fontSize: 10, fontWeight: 'bold', color: '#c62828' },
  
  memoInput: { backgroundColor: '#F9F9FB', borderRadius: 15, padding: 15, minHeight: 80, fontSize: 16, textAlignVertical: 'top', borderWidth: 1, borderColor: '#EEE' },
  
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  setLabel: { fontSize: 16, fontWeight: '700' },
  targetRepsLabel: { fontSize: 12, color: '#c62828', fontWeight: '600', marginTop: 2 },
  weightInput: { backgroundColor: '#F2F2F7', width: 80, padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F2F2F7', backgroundColor: '#FFF' },
  saveBtn: { backgroundColor: '#c62828', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});