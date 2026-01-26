import { auth, db } from '@/fireBaseConfig';
import { addExerciseToDate, deleteExerciseFromDate, Exercise, updateExerciseInDate } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');

  // Date Utilities
  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const selectedStr = getFormattedStr(selectedDate);
  const todayStr = getFormattedStr(new Date());
  const router = useRouter();

  useEffect(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    setWeekDates(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    }));
  }, [selectedDate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, "customers", user.uid, "workouts", selectedStr), (docSnap) => {
      setExercises(docSnap.exists() ? docSnap.data().exercises || [] : []);
    });
    return () => unsub();
  }, [selectedStr]);

  const handleSave = async () => {
    if (!newExName || !newSets || !newReps) return Alert.alert("Error", "Fill all fields");
    const user = auth.currentUser;
    if (!user) return;

    const data: Exercise = { id: editingId || Date.now().toString(), name: newExName, sets: newSets, reps: newReps };
    const res = editingId 
      ? await updateExerciseInDate(user.uid, selectedStr, data)
      : await addExerciseToDate(user.uid, selectedStr, data);

    if (res.success) closeModal();
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete", "Remove this exercise?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const user = auth.currentUser;
        if (user) await deleteExerciseFromDate(user.uid, selectedStr, id);
      }}
    ]);
  };

  const openEditModal = (ex: Exercise) => {
    setEditingId(ex.id);
    setNewExName(ex.name);
    setNewSets(ex.sets);
    setNewReps(ex.reps);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setNewExName(''); setNewSets(''); setNewReps('');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <TouchableOpacity style={styles.monthToggle} onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsExpanded(!isExpanded);
          }}>
            <Text style={styles.monthLabel}>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#000" />
          </TouchableOpacity>

          {isExpanded ? (
            <Calendar
              current={selectedStr}
              onDayPress={day => {
                const [y, m, d] = day.dateString.split('-').map(Number);
                setSelectedDate(new Date(y, m - 1, d));
              }}
              theme={{ todayTextColor: '#c62828', selectedDayBackgroundColor: '#c62828' } as any}
            />
          ) : (
            <View style={styles.weekStrip}>
              {weekDates.map((date, i) => {
                const dateStr = getFormattedStr(date);
                const isSelected = dateStr === selectedStr;
                return (
                  <TouchableOpacity key={i} style={styles.dayCol} onPress={() => setSelectedDate(date)}>
                    <Text style={styles.dayLabel}>{date.toLocaleString('default', { weekday: 'short' }).charAt(0)}</Text>
                    <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>{date.getDate()}</Text>
                    {dateStr === todayStr && !isSelected && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.sectionHeader}>{selectedStr === todayStr ? "Today's Workout" : `Workout for ${selectedDate.toDateString()}`}</Text>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No exercises planned.</Text></View>
          ) : (
            exercises.map((item) => (
              <View key={item.id} style={styles.exerciseRow}>
                <Ionicons name="checkmark-circle" size={22} color="#c62828" />
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>{item.sets} Sets • {item.reps} Reps</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}><Ionicons name="pencil" size={18} color="#007AFF" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.actionBtn}><Ionicons name="trash" size={18} color="#FF3B30" /></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 200 }} />
      </ScrollView>

      {/* COMPACT FOOTER ACTIONS */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 15 }]}>
        
        {/* SMALLER ADD EXERCISE BUTTON */}
        <TouchableOpacity style={styles.addExButton} onPress={() => setModalVisible(true)}>
          <View style={styles.smallIconCircle}>
            <Ionicons name="add" size={20} color="#c62828" />
          </View>
          <Text style={styles.addExTitle}>Add Exercise</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFF" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* START LIFTING (Only shows if exercises exist) */}
        {exercises.length > 0 && (
          <TouchableOpacity style={styles.startLiftingButton}
            onPress={() => router.push('/(main)/active-workout')}>
            <Text style={styles.startLiftingText}>Start Lifting</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? "Edit Exercise" : "Add Exercise"}</Text>
            <TextInput style={styles.input} placeholder="Exercise Name" value={newExName} onChangeText={setNewExName} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Sets" keyboardType="numeric" value={newSets} onChangeText={setNewSets} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Reps" keyboardType="numeric" value={newReps} onChangeText={setNewReps} />
            </View>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
            <TouchableOpacity onPress={closeModal} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  calendarCard: { backgroundColor: '#FFF', paddingVertical: 20, paddingHorizontal: 15, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 3 },
  monthToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  monthLabel: { fontSize: 17, fontWeight: '700', marginRight: 5 },
  weekStrip: { flexDirection: 'row', justifyContent: 'space-around' },
  dayCol: { alignItems: 'center', width: 40 },
  dayLabel: { fontSize: 12, color: '#888', marginBottom: 10 },
  dateText: { fontSize: 16, fontWeight: '500' },
  selectedDateText: { color: '#c62828', fontWeight: 'bold' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#c62828', marginTop: 4 },
  previewSection: { padding: 20 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 20 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10 },
  exerciseInfo: { marginLeft: 15, flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold' },
  exerciseMeta: { fontSize: 14, color: '#666' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 5 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#AAA' },
  
  // Footer styles
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(242,242,247,0.95)', paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  addExButton: { 
    backgroundColor: '#c62828', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, // Reduced padding from 20
    borderRadius: 15, // Slightly tighter radius
  },
  smallIconCircle: { 
    width: 32, 
    height: 32, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12
  },
  addExTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  startLiftingButton: {
    backgroundColor: '#000',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startLiftingText: { color: '#FFF', fontWeight: 'bold' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, marginBottom: 15 },
  saveBtn: { backgroundColor: '#c62828', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', marginTop: 15 }
});