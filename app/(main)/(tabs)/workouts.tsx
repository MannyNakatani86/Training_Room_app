import { auth, db } from '@/fireBaseConfig';
import { addExerciseToDate, Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');

  const selectedStr = selectedDate.toISOString().split('T')[0];

  // REAL-TIME LISTENER: Fetch exercises whenever the date changes
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsub = onSnapshot(doc(db, "customers", user.uid, "workouts", selectedStr), (docSnap) => {
      if (docSnap.exists()) {
        setExercises(docSnap.data().exercises || []);
      } else {
        setExercises([]); // Reset to empty if no data for this day
      }
    });
    return () => unsub();
  }, [selectedStr]);

  const handleAddExercise = async () => {
    if (!newExName || !newSets || !newReps) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const user = auth.currentUser;
    if (user) {
      const newEx: Exercise = {
        id: Date.now().toString(),
        name: newExName,
        sets: newSets,
        reps: newReps
      };
      const res = await addExerciseToDate(user.uid, selectedStr, newEx);
      if (res.success) {
        setModalVisible(false);
        setNewExName(''); setNewSets(''); setNewReps('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* CALENDAR HEADER (Canvas Style) */}
        <View style={styles.calendarHeaderCard}>
          <TouchableOpacity style={styles.monthSelector} onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsExpanded(!isExpanded);
          }}>
            <Text style={styles.monthText}>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#444" />
          </TouchableOpacity>

          {isExpanded && (
            <Calendar
              current={selectedStr}
              onDayPress={day => setSelectedDate(new Date(day.dateString))}
              theme={{ todayTextColor: '#0078d4', selectedDayBackgroundColor: '#0078d4' } as any}
            />
          )}
        </View>

        {/* WORKOUT LIST */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionHeader}>Workout for {selectedDate.toDateString()}</Text>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="barbell-outline" size={50} color="#DDD" />
              <Text style={styles.emptyText}>No exercises added for today.</Text>
              <Text style={styles.emptySubText}>Tap the + button to build your routine.</Text>
            </View>
          ) : (
            exercises.map((item) => (
              <View key={item.id} style={styles.exerciseRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#0078d4" />
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>{item.sets} Sets • {item.reps} Reps</Text>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 150 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON (+) */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* START LIFTING BUTTON */}
      {exercises.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Lifting</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ADD EXERCISE MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TextInput style={styles.input} placeholder="Exercise Name (e.g. Bench Press)" value={newExName} onChangeText={setNewExName} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Sets" keyboardType="numeric" value={newSets} onChangeText={setNewSets} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Reps" keyboardType="numeric" value={newReps} onChangeText={setNewReps} />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: '#666' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAddExercise} style={styles.saveBtn}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  calendarHeaderCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 18, fontWeight: '600', marginRight: 5 },
  previewSection: { padding: 20 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 20 },
  
  // List Styles
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  exerciseInfo: { marginLeft: 15 },
  exerciseName: { fontSize: 16, fontWeight: '500', color: '#333' },
  exerciseMeta: { fontSize: 14, color: '#666', marginTop: 2 },
  
  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10, fontWeight: '600' },
  emptySubText: { fontSize: 14, color: '#BBB', marginTop: 5 },

  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#0078d4', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  startButton: { backgroundColor: '#0078d4', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  startButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 10, marginBottom: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  saveBtn: { backgroundColor: '#0078d4', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 }
});