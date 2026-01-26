import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false); // New Finish Modal
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [weights, setWeights] = useState<string[]>([]);

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchTodayWorkout = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const todayStr = getFormattedStr(new Date());
      try {
        const docRef = doc(db, "customers", user.uid, "workouts", todayStr);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExercises(docSnap.data().exercises || []);
        } else {
          // If no workout, we just go back
          router.replace('/(main)/(tabs)');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayWorkout();
  }, []);

  const openWeightModal = (ex: Exercise) => {
    setActiveExercise(ex);
    const numSets = parseInt(ex.sets) || 0;
    setWeights(new Array(numSets).fill(''));
    setWeightModalVisible(true);
  };

  const updateWeight = (index: number, val: string) => {
    const newWeights = [...weights];
    newWeights[index] = val;
    setWeights(newWeights);
  };

  const saveWeights = () => {
    if (activeExercise) {
      if (!completedIds.includes(activeExercise.id)) {
        setCompletedIds([...completedIds, activeExercise.id]);
      }
    }
    setWeightModalVisible(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#c62828" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: 28 }} /> 
        <Text style={styles.headerTitle}>Workout Mode</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Today's Session</Text>
        <Text style={styles.subtitle}>Tap an exercise to log your weight</Text>

        {exercises.map((ex) => {
          const isDone = completedIds.includes(ex.id);
          return (
            <TouchableOpacity 
              key={ex.id} 
              style={[styles.exerciseCard, isDone && styles.cardDone]}
              onPress={() => openWeightModal(ex)}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.checkCircle, isDone && styles.checkCircleDone]}>
                  {isDone && <Ionicons name="checkmark" size={20} color="#FFF" />}
                </View>
                <View>
                  <Text style={[styles.exName, isDone && styles.textDone]}>{ex.name}</Text>
                  <Text style={styles.exMeta}>{ex.sets} Sets • {ex.reps} Reps</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* BOTTOM ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.finishBtn} 
          onPress={() => setFinishModalVisible(true)} // Open Custom Modal instead of Alert
        >
          <Text style={styles.finishBtnText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>

      {/* 1. WEIGHT INPUT MODAL */}
      <Modal visible={weightModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>{activeExercise?.name}</Text>
            <Text style={styles.modalSubtitle}>Enter weight for each set</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {weights.map((w, index) => (
                <View key={index} style={styles.weightRow}>
                  <Text style={styles.setLabel}>Set {index + 1}</Text>
                  <TextInput
                    style={styles.weightInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={w}
                    onChangeText={(text) => updateWeight(index, text)}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setWeightModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={saveWeights}>
                <Text style={styles.saveText}>Save Sets</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 2. CUSTOM FINISH CONFIRMATION MODAL */}
      <Modal visible={finishModalVisible} animationType="fade" transparent={true}>
        <View style={styles.centerModalOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="trophy-outline" size={40} color="#c62828" />
            </View>
            <Text style={styles.confirmTitle}>Finish Workout?</Text>
            <Text style={styles.confirmSubtitle}>
              Great job! You completed {completedIds.length} out of {exercises.length} exercises.
            </Text>
            
            <TouchableOpacity 
              style={styles.confirmFinishBtn} 
              onPress={() => {
                setFinishModalVisible(false);
                router.replace('/(main)/(tabs)');
              }}
            >
              <Text style={styles.confirmFinishText}>Finish Session</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.keepLiftingBtn} 
              onPress={() => setFinishModalVisible(false)}
            >
              <Text style={styles.keepLiftingText}>Keep Lifting</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: 1 },
  scrollContent: { padding: 25 },
  title: { fontSize: 28, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 20, backgroundColor: '#F9F9FB', marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  cardDone: { backgroundColor: '#F2F2F7', borderColor: '#DDD', opacity: 0.8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  checkCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#DDD', marginRight: 15, alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: '#34C759', borderColor: '#34C759' },
  exName: { fontSize: 18, fontWeight: '700', color: '#000' },
  exMeta: { fontSize: 14, color: '#888', marginTop: 2 },
  textDone: { textDecorationLine: 'line-through', color: '#AAA' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  finishBtn: { backgroundColor: '#000', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Shared Overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  
  // Weight Modal
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#000', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#F2F2F7', padding: 15, borderRadius: 15 },
  setLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  weightInput: { backgroundColor: '#FFF', width: 80, padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: '#DDD' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 20 },
  cancelModalBtn: { flex: 1, alignItems: 'center', padding: 18 },
  saveModalBtn: { flex: 2, backgroundColor: '#c62828', borderRadius: 15, alignItems: 'center', padding: 18 },
  cancelText: { color: '#666', fontWeight: '600' },
  saveText: { color: '#FFF', fontWeight: 'bold' },

  // Finish Confirmation Box
  confirmBox: { backgroundColor: '#FFF', borderRadius: 25, width: '100%', padding: 25, alignItems: 'center' },
  confirmIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  confirmSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  confirmFinishBtn: { backgroundColor: '#c62828', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  confirmFinishText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  keepLiftingBtn: { padding: 15 },
  keepLiftingText: { color: '#666', fontWeight: '600' }
});