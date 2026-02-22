import { auth, db } from '@/fireBaseConfig';
import { addExerciseToDate, deleteExerciseFromDate, Exercise, updateExerciseInDate } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Added useLocalSearchParams
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DEFAULT_EXERCISES = ["Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", "Deadlift", "Clean", "Snatch", "Hang Clean", "Hang Snatch", "Block Clean", "Block Snatch", "Push Press", "Power Jerk", "Split Jerk", "Trap Bar Deadlift"];
const GROUP_ORDER = ["Primer", "Main Lifts", "Power Movements", "Accessories"];
const QUICK_GROUPS = ["Primer", "Power Movements", "Main Lifts", "Accessories"];

export default function WorkoutsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // 1. Listen for incoming date params
  const insets = useSafeAreaInsets();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newGroupTitle, setNewGroupTitle] = useState('Main Lifts');
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

  // 2. EFFECT: If a date is passed from Home Screen, update the selection
  useEffect(() => {
    if (params.date && typeof params.date === 'string') {
      const [y, m, d] = params.date.split('-').map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    }
  }, [params.date]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    return onSnapshot(doc(db, "customers", user.uid, "workouts", selectedStr), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExercises(data.exercises || []);
        setIsFinished(data.isFinished || false);
      } else {
        setExercises([]); setIsFinished(false);
      }
    });
  }, [selectedStr]);

  useEffect(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    setWeekDates(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d;
    }));
  }, [selectedDate]);

  const handleNameChange = (text: string) => {
    setNewExName(text);
    if (text.trim().length > 0) {
      const filtered = DEFAULT_EXERCISES.filter(ex => ex.toLowerCase().includes(text.toLowerCase()));
      setFilteredSuggestions(filtered);
    } else { setFilteredSuggestions([]); }
  };

  const handleSetsChange = (val: string) => {
    setNewSets(val);
    const num = parseInt(val) || 0;
    const newArr = new Array(num).fill('');
    repsArray.forEach((v, i) => { if(i < num) newArr[i] = v; });
    setRepsArray(newArr);
  };

  const handleSave = async () => {
    if (!newExName || !newSets || repsArray.some(r => r === '')) return Alert.alert("Error", "Fill all fields");
    const user = auth.currentUser;
    if (user) {
      const data: Exercise = { id: editingId || Date.now().toString(), name: newExName, sets: newSets, reps: repsArray, groupTitle: newGroupTitle || "Main Lifts" };
      const res = editingId ? await updateExerciseInDate(user.uid, selectedStr, data) : await addExerciseToDate(user.uid, selectedStr, data);
      if (res.success) closeModal();
    }
  };

  const closeModal = () => {
    setModalVisible(false); setEditingId(null);
    setNewExName(''); setNewSets(''); setRepsArray([]); setNewGroupTitle('Main Lifts');
    setFilteredSuggestions([]);
  };

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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.calendarCard}>
          <TouchableOpacity style={styles.monthToggle} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setIsExpanded(!isExpanded); }}>
            <Text style={styles.monthLabel}>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#000" />
          </TouchableOpacity>
          {isExpanded ? (
            <Calendar current={selectedStr} onDayPress={day => { const [y,m,d] = day.dateString.split('-').map(Number); setSelectedDate(new Date(y, m-1, d)); setIsExpanded(false); }} theme={{ todayTextColor: '#c62828', selectedDayBackgroundColor: '#c62828' } as any}/>
          ) : (
            <View style={styles.weekStrip}>
              {weekDates.map((date, i) => {
                const dStr = getFormattedStr(date);
                const isSelected = dStr === selectedStr;
                return (
                  <TouchableOpacity key={i} style={styles.dayCol} onPress={() => setSelectedDate(date)}>
                    <Text style={styles.dayLabel}>{date.toLocaleString('default', { weekday: 'short' }).charAt(0)}</Text>
                    <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>{date.getDate()}</Text>
                    {dStr === todayStr && !isSelected && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.sectionHeader}>{selectedStr === todayStr ? "Today's Plan" : `Plan for ${selectedDate.toDateString()}`}</Text>
          {sortedGroupNames.map((groupName) => (
            <View key={groupName} style={styles.groupWrapper}>
              <Text style={styles.groupTitleText}>{groupName.toUpperCase()}</Text>
              {groupedExercises[groupName].map((item) => (
                <View key={item.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, isFinished && { color: '#888' }]}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>{item.sets} Sets • {Array.isArray(item.reps) ? item.reps.join(', ') : item.reps} Reps</Text>
                  </View>
                  {!isFinished && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => { setEditingId(item.id); setNewExName(item.name); setNewSets(item.sets); setRepsArray(Array.isArray(item.reps) ? item.reps : [item.reps]); setNewGroupTitle(item.groupTitle || 'Main Lifts'); setModalVisible(true); }} style={styles.actionBtn}><Ionicons name="pencil" size={18} color="#007AFF" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => { Alert.alert("Delete", "Remove exercise?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: async () => { const user = auth.currentUser; if (user) await deleteExerciseFromDate(user.uid, selectedStr, item.id); }}]); }} style={styles.actionBtn}><Ionicons name="trash" size={18} color="#FF3B30" /></TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 15 }]}>
        {!isFinished ? (
          <>
            <TouchableOpacity style={styles.addExButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.addExTitle}>Add Exercise</Text>
            </TouchableOpacity>
            {exercises.length > 0 && selectedStr === todayStr && (
              <TouchableOpacity style={styles.startLiftingButton} onPress={() => router.push('/(main)/active-workout')}>
                <Text style={styles.startLiftingText}>Start Workout</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.finishedBtn}><Text style={styles.finishedBtnText}>Session Complete</Text></View>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? "Edit Exercise" : "New Exercise"}</Text>
            <TextInput style={styles.input} placeholder="Exercise Name" value={newExName} onChangeText={handleNameChange} />
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
            <TextInput style={styles.input} placeholder="Group" value={newGroupTitle} onChangeText={setNewGroupTitle} />
            <View style={styles.suggestionsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {QUICK_GROUPS.map(g => (
                  <TouchableOpacity key={g} style={[styles.suggestionChip, newGroupTitle === g && { backgroundColor: '#c62828', borderColor: '#c62828' }]} onPress={() => setNewGroupTitle(g)}>
                    <Text style={[styles.suggestionText, newGroupTitle === g && { color: '#FFF' }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput style={styles.input} placeholder="Sets" keyboardType="numeric" value={newSets} onChangeText={handleSetsChange} />
            <View style={styles.repsGrid}>{repsArray.map((r, i) => (<View key={i} style={styles.repBox}><Text style={styles.repLabel}>Rep {i+1}</Text><TextInput style={styles.repInput} keyboardType="numeric" value={r} placeholder="0" onChangeText={(t) => { const a = [...repsArray]; a[i] = t; setRepsArray(a); }} /></View>))}</View>
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
  groupTitleText: { fontSize: 11, fontWeight: '800', color: '#AAA', marginBottom: 8, marginLeft: 5, letterSpacing: 0.5 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 8 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold' },
  exerciseMeta: { fontSize: 14, color: '#666', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 5 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(242,242,247,0.95)', paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  addExButton: { backgroundColor: '#c62828', padding: 12, borderRadius: 15, alignItems: 'center' },
  addExTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  startLiftingButton: { backgroundColor: '#000', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  startLiftingText: { color: '#FFF', fontWeight: 'bold' },
  finishedBtn: { backgroundColor: '#34C759', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  finishedBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 16 },
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