import { auth, db } from '@/fireBaseConfig';
import { addExerciseToDate, deleteExerciseFromDate, Exercise, updateExerciseInDate } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_EXERCISES = [
  "Bench Press", "Back Squat", "Front Squat", "Incline Bench Press",
  "Deadlift", "Clean", "Snatch", "Hang Clean", "Hang Snatch",
  "Block Clean", "Block Snatch", "Push Press", "Power Jerk",
  "Split Jerk", "Trap Bar Deadlift"
];

const WORKOUT_GROUPS = ["Primer", "Power Movements", "Main Lifts", "Accessories"];

export default function WorkoutsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newGroupTitle, setNewGroupTitle] = useState('Main Lifts'); // Default
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [newSets, setNewSets] = useState('');
  const [repsArray, setRepsArray] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const selectedStr = getFormattedStr(selectedDate);
  const todayStr = getFormattedStr(new Date());

  const handleDayPress = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(false);
  };

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

  const handleSetsChange = (val: string) => {
    setNewSets(val);
    const num = parseInt(val) || 0;
    const newArr = new Array(num).fill('');
    repsArray.forEach((v, i) => { if (i < num) newArr[i] = v; });
    setRepsArray(newArr);
  };

  const handleNameChange = (text: string) => {
    setNewExName(text);
    if (text.trim().length > 0) {
      const filtered = DEFAULT_EXERCISES.filter(ex => ex.toLowerCase().includes(text.toLowerCase()));
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleSave = async () => {
    if (!newExName || !newSets || repsArray.some(r => r === '')) return Alert.alert("Error", "Fill all fields");
    const user = auth.currentUser;
    if (user) {
      const data: Exercise = { 
        id: editingId || Date.now().toString(), 
        name: newExName, 
        sets: newSets, 
        reps: repsArray,
        groupTitle: newGroupTitle 
      };
      const res = editingId ? await updateExerciseInDate(user.uid, selectedStr, data) : await addExerciseToDate(user.uid, selectedStr, data);
      if (res.success) closeModal();
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setNewExName(''); setNewSets(''); setRepsArray([]); setNewGroupTitle('Main Lifts');
    setShowGroupDropdown(false);
    setFilteredSuggestions([]);
  };

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

          {isExpanded ? (
            <Calendar current={selectedStr} onDayPress={day => handleDayPress(day.dateString)} theme={{ todayTextColor: '#c62828', selectedDayBackgroundColor: '#c62828' } as any}/>
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
          {Object.keys(groupedExercises).length === 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No exercises planned.</Text></View>
          ) : (
            Object.keys(groupedExercises).map((groupName) => (
              <View key={groupName} style={styles.groupWrapper}>
                <Text style={styles.groupTitleText}>{groupName.toUpperCase()}</Text>
                {(groupedExercises[groupName] || []).map((item) => (
                  <View key={item.id} style={styles.exerciseRow}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      <Text style={styles.exerciseMeta}>{item.sets} Sets • {Array.isArray(item.reps) ? item.reps.join(', ') : item.reps} Reps</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => {
                        setEditingId(item.id); setNewExName(item.name); 
                        setNewSets(item.sets); setRepsArray(Array.isArray(item.reps) ? item.reps : [item.reps]); 
                        setNewGroupTitle(item.groupTitle || 'Main Lifts'); setModalVisible(true);
                      }} style={styles.actionBtn}><Ionicons name="pencil" size={18} color="#007AFF" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        Alert.alert("Delete", "Remove exercise?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: async () => { const user = auth.currentUser; if (user) await deleteExerciseFromDate(user.uid, selectedStr, item.id); }}]);
                      }} style={styles.actionBtn}><Ionicons name="trash" size={18} color="#FF3B30" /></TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 15 }]}>
        <TouchableOpacity style={styles.addExButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#FFF" style={{marginRight: 10}} />
          <Text style={styles.addExTitle}>Add Exercise</Text>
        </TouchableOpacity>
        {exercises.length > 0 && <TouchableOpacity style={styles.startLiftingButton} onPress={() => router.push('/(main)/active-workout')}><Text style={styles.startLiftingText}>Start Workout</Text></TouchableOpacity>}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? "Edit Exercise" : "New Exercise"}</Text>
            
            <Text style={styles.label}>Exercise Name</Text>
            <TextInput style={styles.input} placeholder="Search or type..." value={newExName} onChangeText={handleNameChange} />
            
            {filteredSuggestions.length > 0 && (
              <View style={styles.suggestionsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {filteredSuggestions.map(s => (
                    <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => {setNewExName(s); setFilteredSuggestions([]);}}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* CUSTOM DROPDOWN SELECTOR FOR GROUP */}
            <Text style={styles.label}>Workout Group</Text>
            <TouchableOpacity 
                style={styles.dropdownTrigger} 
                onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setShowGroupDropdown(!showGroupDropdown);
                }}
            >
                <Text style={styles.dropdownTriggerText}>{newGroupTitle}</Text>
                <Ionicons name={showGroupDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
            </TouchableOpacity>

            {showGroupDropdown && (
                <View style={styles.dropdownContent}>
                    {WORKOUT_GROUPS.map((g) => (
                        <TouchableOpacity key={g} style={styles.dropdownOption} onPress={() => { setNewGroupTitle(g); setShowGroupDropdown(false); }}>
                            <Text style={[styles.dropdownOptionText, newGroupTitle === g && { color: '#c62828', fontWeight: 'bold' }]}>{g}</Text>
                            {newGroupTitle === g && <Ionicons name="checkmark" size={18} color="#c62828" />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>Number of Sets</Text>
            <TextInput style={styles.input} placeholder="e.g. 3" keyboardType="numeric" value={newSets} onChangeText={handleSetsChange} />
            
            {repsArray.length > 0 && (
                <Text style={styles.label}>Reps per Set</Text>
            )}
            <View style={styles.repsGrid}>
               {repsArray.map((r, i) => (
                 <View key={i} style={styles.repBox}>
                    <Text style={styles.repLabel}>Rep {i+1}</Text>
                    <TextInput style={styles.repInput} keyboardType="numeric" value={r} onChangeText={(t) => { const a = [...repsArray]; a[i] = t; setRepsArray(a); }} />
                 </View>
               ))}
            </View>

            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save Exercise</Text></TouchableOpacity>
            <TouchableOpacity onPress={closeModal} style={styles.cancelBtn}><Text style={{ color: '#666' }}>Cancel</Text></TouchableOpacity>
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
  groupTitleText: { fontSize: 11, fontWeight: '800', color: '#AAA', marginBottom: 8, marginLeft: 5, letterSpacing: 0.5 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 8 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold' },
  exerciseMeta: { fontSize: 14, color: '#666', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 5 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(242,242,247,0.95)', paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  addExButton: { backgroundColor: '#c62828', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 15 },
  addExTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  startLiftingButton: { backgroundColor: '#000', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  startLiftingText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 11, color: '#888', marginBottom: 6, fontWeight: '800', textTransform: 'uppercase' },
  input: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  
  // DROPDOWN STYLES
  dropdownTrigger: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dropdownTriggerText: { fontSize: 16, color: '#000' },
  dropdownContent: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#EEE', marginBottom: 15, overflow: 'hidden' },
  dropdownOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownOptionText: { fontSize: 14, color: '#333' },

  suggestionsWrapper: { marginBottom: 15, height: 35 },
  suggestionChip: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#FFCDD2' },
  suggestionText: { color: '#c62828', fontSize: 12, fontWeight: '700' },
  repsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  repBox: { alignItems: 'center' },
  repLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  repInput: { backgroundColor: '#F2F2F7', width: 55, height: 40, borderRadius: 8, textAlign: 'center', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#c62828', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', marginTop: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#AAA' },
});