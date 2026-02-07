import { auth, db } from '@/fireBaseConfig';
import { addExerciseToDate, Exercise, updateExerciseInDate } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newSets, setNewSets] = useState('');
  const [repsArray, setRepsArray] = useState<string[]>([]);

  // Correct date formatting for Firestore keys
  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const selectedStr = getFormattedStr(selectedDate);
  const todayStr = getFormattedStr(new Date());

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
    return onSnapshot(doc(db, "customers", user.uid, "workouts", selectedStr), (docSnap) => {
      setExercises(docSnap.exists() ? docSnap.data().exercises || [] : []);
    });
  }, [selectedStr]);

  const handleSetsChange = (val: string) => {
    setNewSets(val);
    const num = parseInt(val) || 0;
    const newArr = new Array(num).fill('');
    repsArray.forEach((v, i) => { if (i < num) newArr[i] = v; });
    setRepsArray(newArr);
  };

  const handleSave = async () => {
    if (!newExName || !newSets || repsArray.some(r => r === '')) {
      Alert.alert("Error", "Please fill in the name, number of sets, and all rep counts.");
      return;
    }
    const user = auth.currentUser;
    if (user) {
      const data: Exercise = {
        id: editingId || Date.now().toString(),
        name: newExName,
        sets: newSets,
        reps: repsArray,
        groupTitle: newGroupTitle || "General"
      };
      const res = editingId ? await updateExerciseInDate(user.uid, selectedStr, data) : await addExerciseToDate(user.uid, selectedStr, data);
      if (res.success) closeModal();
    }
  };

  const closeModal = () => {
    setModalVisible(false); setEditingId(null);
    setNewExName(''); setNewSets(''); setRepsArray([]); setNewGroupTitle('');
  };

  // grouping logic with safe access
  const groupedExercises = exercises.reduce((groups: { [key: string]: Exercise[] }, ex) => {
    const title = ex.groupTitle || "General";
    if (!groups[title]) groups[title] = [];
    groups[title].push(ex);
    return groups;
  }, {});

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

          {/* Expanded Calendar logic */}
          {isExpanded && (
            <View style={{ height: 320 }}>
               <Text style={{textAlign: 'center', color: '#999', fontSize: 12, marginBottom: 10}}>Tap a date to change view</Text>
               {/* Note: Standard Calendar goes here, omitted for brevity of the fix */}
            </View>
          )}

          {!isExpanded && (
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
          {Object.keys(groupedExercises).length === 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No exercises planned.</Text></View>
          ) : (
            Object.keys(groupedExercises).map((groupName) => (
              <View key={groupName} style={styles.groupWrapper}>
                <Text style={styles.groupTitleText}>{groupName.toUpperCase()}</Text>
                {/* FIX: Ensure we use bracket notation [groupName] */}
                {(groupedExercises[groupName] || []).map((item) => (
                  <View key={item.id} style={styles.exerciseRow}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {item.sets} Sets • {Array.isArray(item.reps) ? item.reps.join(', ') : item.reps} Reps
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                      setEditingId(item.id); setNewExName(item.name); 
                      setNewSets(item.sets); setRepsArray(Array.isArray(item.reps) ? item.reps : [item.reps]); 
                      setNewGroupTitle(item.groupTitle || ''); setModalVisible(true);
                    }}><Ionicons name="pencil" size={18} color="#007AFF" /></TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 15 }]}>
        <TouchableOpacity style={styles.addExButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#FFF" style={{marginRight: 10}} />
          <Text style={styles.addExTitle}>Add Exercise</Text>
        </TouchableOpacity>
        {exercises.length > 0 && (
          <TouchableOpacity style={styles.startLiftingButton} onPress={() => router.push('/(main)/active-workout')}>
            <Text style={styles.startLiftingText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? "Edit Exercise" : "New Exercise"}</Text>
            <TextInput style={styles.input} placeholder="Exercise Name" value={newExName} onChangeText={setNewExName} />
            <TextInput style={styles.input} placeholder="Group (e.g. Circuit 1)" value={newGroupTitle} onChangeText={setNewGroupTitle} />
            <TextInput style={styles.input} placeholder="Sets" keyboardType="numeric" value={newSets} onChangeText={handleSetsChange} />
            
            <View style={styles.repsContainer}>
               {repsArray.map((r, i) => (
                 <TextInput 
                   key={i} 
                   style={styles.repInput} 
                   placeholder={`S${i+1}`} 
                   keyboardType="numeric" 
                   value={r} 
                   onChangeText={(t) => {
                     const a = [...repsArray]; a[i] = t; setRepsArray(a);
                   }}
                 />
               ))}
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
  groupWrapper: { marginBottom: 20 },
  groupTitleText: { fontSize: 11, fontWeight: '800', color: '#AAA', marginBottom: 8, marginLeft: 5 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 8 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold' },
  exerciseMeta: { fontSize: 14, color: '#666', marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(242,242,247,0.95)', paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  addExButton: { backgroundColor: '#c62828', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 15 },
  addExTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  startLiftingButton: { backgroundColor: '#000', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  startLiftingText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 10, marginBottom: 10 },
  repsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 15 },
  repInput: { backgroundColor: '#F2F2F7', width: 45, height: 40, borderRadius: 8, textAlign: 'center' },
  saveBtn: { backgroundColor: '#c62828', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', marginTop: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#AAA' },
});