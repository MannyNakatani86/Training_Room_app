import { auth, db } from '@/fireBaseConfig';
import { Exercise, addExerciseToDate, copyWorkoutToToday, deleteExerciseFromDate, updateExerciseInDate } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions, KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../_layout';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LEADERBOARD_EXERCISES = ["Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", "Deadlift", "Clean", "Snatch", "Jerk", "Push Press", "Trap Bar Deadlift"];
const GROUP_ORDER = ["Primer", "Power Movements", "Main Lifts", "Accessories"];
const QUICK_GROUPS = ["Primer", "Power Movements", "Main Lifts", "Accessories"];

export default function WorkoutsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { unit } = useUser();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  const [allKnownExercises, setAllKnownExercises] = useState<string[]>(LEADERBOARD_EXERCISES);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [redoModalVisible, setRedoModalVisible] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState('');
  const [newGroupTitle, setNewGroupTitle] = useState('Main Lifts');
  const [newSets, setNewSets] = useState('');
  const [repsArray, setRepsArray] = useState<string[]>([]);
  const [repUnits, setRepUnits] = useState<string[]>([]); 

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const selectedStr = getFormattedStr(selectedDate);
  const todayStr = getFormattedStr(new Date());
  const toTitleCase = (str: string) => str.replace(/\b\w/g, (char) => char.toUpperCase());

  const formatMeta = (item: Exercise) => {
    const repsPart = Array.isArray(item.reps) ? item.reps.join(',') : item.reps;
    const units = Array.isArray(item.repUnits) ? item.repUnits.join(' ') : '';
    return `${item.sets}x${repsPart}${units ? ' ' + units : ''}`;
  };

  const getSupersetColor = (id: string) => {
    const colors = ['#007AFF', '#5856D6', '#AF52DE', '#FF9500', '#FF2D55', '#5AC8FA', '#34C759'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) { hash = id.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    const fetchHistoryNames = async () => {
      const user = auth.currentUser;
      if (!user || !modalVisible) return;
      const snapshot = await getDocs(query(collection(db, "customers", user.uid, "workouts")));
      const namesSet = new Set(LEADERBOARD_EXERCISES);
      snapshot.forEach(doc => { doc.data().exercises?.forEach((ex: any) => namesSet.add(ex.name)); });
      setAllKnownExercises(Array.from(namesSet));
    };
    fetchHistoryNames();
  }, [modalVisible]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    return onSnapshot(doc(db, "customers", user.uid, "workouts", selectedStr), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExercises(data.exercises || []);
        setIsFinished(data.isFinished || false);
        setIsStarted(data.isStarted || false);
      } else {
        setExercises([]); setIsFinished(false); setIsStarted(false);
      }
    });
  }, [selectedStr]);

  useEffect(() => {
    if (params.date && typeof params.date === 'string') {
      const [y, m, d] = params.date.split('-').map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    }
  }, [params.date]);

  useEffect(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    setWeekDates(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d;
    }));
  }, [selectedDate]);

  const handleNameChange = (text: string) => {
    const capitalized = toTitleCase(text);
    setNewExName(capitalized);
    if (text.trim().length > 0) {
      setFilteredSuggestions(allKnownExercises.filter(ex => ex.toLowerCase().includes(text.toLowerCase())).slice(0, 10));
    } else { setFilteredSuggestions([]); }
  };

  const handleSetsChange = (val: string) => {
    setNewSets(val);
    const num = parseInt(val) || 0;
    const newArr = new Array(num).fill('');
    repsArray.forEach((v, i) => { if(i < num) newArr[i] = v; });
    setRepsArray(newArr);
  };

  // FIXED: Standardized function name
  const toggleUnitSelection = (u: string) => {
    setRepUnits((prev) => prev.includes(u) ? prev.filter(item => item !== u) : [...prev, u]);
  };

  const toggleSuperset = async (ex1: Exercise, ex2: Exercise) => {
    const user = auth.currentUser;
    if (!user) return;
    let updatedExercises = [...exercises];
    if (ex1.supersetId && ex1.supersetId === ex2.supersetId) {
      updatedExercises = updatedExercises.map(e => (e.id === ex1.id || e.id === ex2.id) ? { ...e, supersetId: "" } : e);
    } else {
      const newId = ex1.supersetId || ex2.supersetId || `ss_${Date.now()}`;
      updatedExercises = updatedExercises.map(e => (e.id === ex1.id || e.id === ex2.id) ? { ...e, supersetId: newId } : e);
    }
    await updateDoc(doc(db, "customers", user.uid, "workouts", selectedStr), { exercises: updatedExercises });
  };

  const executeCopyWorkout = async () => {
    const user = auth.currentUser;
    if (user) {
      const res = await copyWorkoutToToday(user.uid, selectedStr, todayStr);
      setCopyModalVisible(false);
      if (res.success) router.push('/(main)/active-workout');
      else Alert.alert("Error", String(res.error));
    }
  };

  const executeUnlock = async () => {
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, "customers", user.uid, "workouts", selectedStr), { isFinished: false });
      setRedoModalVisible(false);
      if (selectedStr === todayStr) router.push('/(main)/active-workout');
    }
  };

  const handleSave = async () => {
    if (!newExName || !newSets || repsArray.some(r => r === '')) return Alert.alert("Error", "Fill all fields");
    const user = auth.currentUser;
    if (user) {
      const data: Exercise = { id: editingId || Date.now().toString(), name: newExName.trim(), sets: newSets, reps: repsArray, groupTitle: newGroupTitle, repUnits };
      const res = editingId ? await updateExerciseInDate(user.uid, selectedStr, data) : await addExerciseToDate(user.uid, selectedStr, data);
      if (res.success) closeModal();
    }
  };

  const closeModal = () => {
    setModalVisible(false); setEditingId(null);
    setNewExName(''); setNewSets(''); setRepsArray([]); setNewGroupTitle('Main Lifts');
    setRepUnits([]); setFilteredSuggestions([]);
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
          {!isExpanded ? (
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
          ) : (
            <Calendar current={selectedStr} onDayPress={day => { const [y,m,d] = day.dateString.split('-').map(Number); setSelectedDate(new Date(y, m-1, d)); setIsExpanded(false); }} theme={{ todayTextColor: '#c62828', selectedDayBackgroundColor: '#c62828' } as any}/>
          )}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.sectionHeader}>{selectedStr === todayStr ? "Today's Plan" : `Plan for ${selectedDate.toDateString()}`}</Text>
          {sortedGroupNames.map((groupName) => {
            const groupItems = groupedExercises[groupName];
            const isSupersetEligible = groupName !== "Main Lifts";
            return (
              <View key={groupName} style={styles.groupWrapper}>
                <Text style={styles.groupTitleText}>{groupName.toUpperCase()}</Text>
                {groupItems.map((item, idx) => {
                  const prevItem = groupItems[idx - 1];
                  const nextItem = groupItems[idx + 1];
                  const hasSuperset = !!item.supersetId;
                  const isFirstInSS = hasSuperset && (!prevItem || prevItem.supersetId !== item.supersetId);
                  const isLastInSS = hasSuperset && (!nextItem || nextItem.supersetId !== item.supersetId);
                  const isSameSSAsNext = nextItem && item.supersetId && item.supersetId === nextItem.supersetId;
                  const ssColor = hasSuperset ? getSupersetColor(item.supersetId!) : 'transparent';
                  return (
                    <View key={item.id} style={{ zIndex: groupItems.length - idx }}>
                      <View style={[styles.exerciseRow, hasSuperset ? { borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: ssColor, borderTopWidth: isFirstInSS ? 1.5 : 0, borderBottomWidth: isLastInSS ? 1.5 : 0, borderTopLeftRadius: isFirstInSS ? 15 : 0, borderTopRightRadius: isFirstInSS ? 15 : 0, borderBottomLeftRadius: isLastInSS ? 15 : 0, borderBottomRightRadius: isLastInSS ? 15 : 0, marginBottom: isLastInSS ? 15 : 0 } : { marginBottom: 15 }]}>
                        <View style={styles.exerciseInfo}><Text style={[styles.exerciseName, isFinished && { color: '#888' }]}>{item.name}</Text><Text style={styles.exerciseMeta}>{formatMeta(item)}</Text></View>
                        {!isFinished && (
                          <View style={styles.actionRow}>
                            <TouchableOpacity onPress={() => { setEditingId(item.id); setNewExName(item.name); setNewSets(item.sets); setRepsArray(item.reps); setNewGroupTitle(item.groupTitle || 'Main Lifts'); setRepUnits(Array.isArray(item.repUnits) ? item.repUnits : []); setModalVisible(true); }}><Ionicons name="pencil" size={18} color="#007AFF" /></TouchableOpacity>
                            <TouchableOpacity onPress={() => { Alert.alert("Delete", "Remove?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: async () => { const user = auth.currentUser; if (user) await deleteExerciseFromDate(user.uid, selectedStr, item.id); }}]); }}><Ionicons name="trash" size={18} color="#FF3B30" /></TouchableOpacity>
                          </View>
                        )}
                      </View>
                      {!isFinished && nextItem && isSupersetEligible && (
                        <TouchableOpacity style={styles.ssLinkBtn} onPress={() => toggleSuperset(item, nextItem)}><Ionicons name={isSameSSAsNext ? "remove" : "add"} size={18} color={isSameSSAsNext ? getSupersetColor(item.supersetId!) : "#CCC"} /></TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 15 }]}>
        {!isFinished ? (
          <>
            <TouchableOpacity style={styles.addExButton} onPress={() => setModalVisible(true)}><Text style={styles.addExTitle}>Add Exercise</Text></TouchableOpacity>
            {exercises.length > 0 && (
                selectedStr === todayStr ? (
                    <TouchableOpacity style={[styles.startLiftingButton, isStarted && { backgroundColor: '#c62828' }]} onPress={() => router.push('/(main)/active-workout')}><Text style={styles.startLiftingText}>{isStarted ? "Resume Workout" : "Start Workout"}</Text></TouchableOpacity>
                ) : (
                    <TouchableOpacity style={[styles.startLiftingButton, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#000' }]} onPress={() => setCopyModalVisible(true)}><Text style={[styles.startLiftingText, { color: '#000' }]}>Do Workout Today</Text></TouchableOpacity>
                )
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.finishedBtn} onPress={() => setRedoModalVisible(true)}>
            <Text style={styles.finishedBtnText}>Session Complete</Text><Ionicons name="refresh" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={redoModalVisible} animationType="fade" transparent={true}>
        <View style={styles.centerModalOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconCircle}><Ionicons name="refresh" size={40} color="#c62828" /></View>
            <Text style={styles.confirmTitle}>Unlock Session?</Text>
            <Text style={styles.confirmSubtitle}>Would you like to redo or edit this completed session?</Text>
            <TouchableOpacity style={styles.confirmFinishBtn} onPress={executeUnlock}><Text style={styles.confirmFinishText}>Yes, Unlock</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setRedoModalVisible(false)}><Text style={{ color: '#666', fontWeight: '600' }}>CANCEL</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={copyModalVisible} animationType="fade" transparent={true}>
        <View style={styles.centerModalOverlay}>
          <View style={styles.confirmBox}>
            <View style={[styles.confirmIconCircle, {backgroundColor: '#E3F2FD'}]}><Ionicons name="copy-outline" size={40} color="#007AFF" /></View>
            <Text style={styles.confirmTitle}>Move Workout?</Text>
            <Text style={styles.confirmSubtitle}>Would you like to copy these exercises and start this session today?</Text>
            <TouchableOpacity style={[styles.confirmFinishBtn, {backgroundColor: '#007AFF'}]} onPress={executeCopyWorkout}><Text style={styles.confirmFinishText}>Yes, Start Today</Text></TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setCopyModalVisible(false)}><Text style={{ color: '#666', fontWeight: '600' }}>CANCEL</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <Pressable style={styles.modalOverlay} onPress={closeModal} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.sheetContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalContent}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{editingId ? "Edit Exercise" : "New Exercise"}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Exercise Name</Text>
              <TextInput style={styles.input} placeholder="Name" value={newExName} onChangeText={handleNameChange} autoCapitalize="words" />
              {filteredSuggestions.length > 0 && (
                <View style={styles.suggestionsRow}><ScrollView horizontal showsHorizontalScrollIndicator={false}>{filteredSuggestions.map(s => (<TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => {setNewExName(s); setFilteredSuggestions([]);}}><Text style={styles.suggestionText}>{s}</Text></TouchableOpacity>))}</ScrollView></View>
              )}
              <Text style={styles.label}>Workout Group</Text>
              <TextInput style={styles.input} placeholder="Group" value={newGroupTitle} onChangeText={setNewGroupTitle} />
              <View style={styles.groupChipsGrid}>{QUICK_GROUPS.map(g => (<TouchableOpacity key={g} style={[styles.suggestionChip, newGroupTitle === g && { backgroundColor: '#c62828', borderColor: '#c62828' }]} onPress={() => setNewGroupTitle(g)}><Text style={[styles.suggestionText, newGroupTitle === g && { color: '#FFF' }]}>{g}</Text></TouchableOpacity>))}</View>
              <Text style={styles.label}>Sets</Text>
              <TextInput style={styles.input} placeholder="e.g. 3" keyboardType="numeric" value={newSets} onChangeText={handleSetsChange} />
              {repsArray.length > 0 && (
                  <View style={styles.repsHeaderRow}>
                      <Text style={styles.label}>Sets</Text>
                      <View style={{flexDirection: 'row', gap: 5}}>
                          <TouchableOpacity style={[styles.unitToggle, repUnits.includes('ea') && styles.unitToggleActive]} onPress={() => toggleUnitSelection('ea')}><Text style={[styles.unitToggleText, repUnits.includes('ea') && styles.unitToggleTextActive]}>ea</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.unitToggle, repUnits.includes('secs') && styles.unitToggleActive]} onPress={() => toggleUnitSelection('secs')}><Text style={[styles.unitToggleText, repUnits.includes('secs') && styles.unitToggleTextActive]}>secs</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.allBtn} onPress={() => setRepsArray(new Array(repsArray.length).fill(repsArray[0]))}><Text style={styles.allBtnText}>Set 1 for all</Text></TouchableOpacity>
                      </View>
                  </View>
              )}
              <View style={styles.repsGrid}>{repsArray.map((r, i) => (<View key={i} style={styles.repBox}><Text style={styles.repLabel}>Set {i+1}</Text><TextInput style={styles.repInput} keyboardType="numeric" value={r} placeholder="0" onChangeText={(t) => { const a = [...repsArray]; a[i] = t; setRepsArray(a); }} /></View>))}</View>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold' },
  exerciseMeta: { fontSize: 13, color: '#666' },
  actionRow: { flexDirection: 'row', gap: 15 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(242,242,247,0.95)', paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  addExButton: { backgroundColor: '#c62828', padding: 12, borderRadius: 15, alignItems: 'center' },
  addExTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  startLiftingButton: { backgroundColor: '#000', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  startLiftingText: { color: '#FFF', fontWeight: 'bold' },
  finishedBtn: { backgroundColor: '#34C759', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
  finishedBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  confirmBox: { backgroundColor: '#FFF', borderRadius: 25, width: width - 60, padding: 25, alignItems: 'center' },
  confirmIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  confirmSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25 },
  confirmFinishBtn: { backgroundColor: '#c62828', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmFinishText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetContainer: { position: 'absolute', bottom: 0, width: '100%', maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 25, paddingTop: 15 },
  handle: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 11, color: '#888', marginBottom: 6, fontWeight: '800', textTransform: 'uppercase' },
  input: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 16 },
  suggestionsRow: { marginBottom: 15, height: 35 },
  groupChipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  suggestionChip: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#FFCDD2', marginBottom: 5 },
  suggestionText: { color: '#c62828', fontSize: 11, fontWeight: '700' },
  repsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  allBtn: { backgroundColor: '#F2F2F7', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  allBtnText: { fontSize: 9, fontWeight: 'bold', color: '#c62828' },
  unitToggle: { backgroundColor: '#F2F2F7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#DDD' },
  unitToggleActive: { backgroundColor: '#c62828', borderColor: '#c62828' },
  unitToggleText: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  unitToggleTextActive: { color: '#FFF' },
  repsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  repBox: { alignItems: 'center' },
  repLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  repInput: { backgroundColor: '#F2F2F7', width: 55, height: 40, borderRadius: 8, textAlign: 'center', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#c62828', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { alignItems: 'center', marginTop: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#AAA' },
  ssLinkBtn: { alignSelf: 'center', height: 32, width: 32, justifyContent: 'center', alignItems: 'center', marginVertical: -24, zIndex: 999, backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, elevation: 5, borderWidth: 1, borderColor: '#EEE' },
});