import OnboardingModal from '@/components/OnboardingModal';
import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { useUser } from '../_layout';

const { width } = Dimensions.get('window');

// MUST-HAVE GROUP ORDER
const GROUP_ORDER = ["Primer", "Power Movements", "Main Lifts", "Accessories"];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { fullName } = useUser();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [workouts, setWorkouts] = useState<Record<string, any>>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [redoModalVisible, setRedoModalVisible] = useState(false);
  const [selectedRedoDate, setSelectedRedoDate] = useState('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const todayStr = getFormattedStr(new Date());

  const workoutDays = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      id: i.toString(),
      dateStr: getFormattedStr(date),
      dateLabel: i === 0 ? "TODAY" : i === 1 ? "TOMORROW" : date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
      fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubs = workoutDays.map((day) => {
      return onSnapshot(doc(db, "customers", user.uid, "workouts", day.dateStr), (docSnap) => {
        setWorkouts(prev => ({ ...prev, [day.dateStr]: docSnap.exists() ? docSnap.data() : null }));
      });
    });
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const executeUnlock = async () => {
    const user = auth.currentUser;
    if (user && selectedRedoDate) {
      await updateDoc(doc(db, "customers", user.uid, "workouts", selectedRedoDate), { isFinished: false });
      setRedoModalVisible(false);
      if (selectedRedoDate === todayStr) router.push('/(main)/active-workout');
      else router.push({ pathname: '/workouts', params: { date: selectedRedoDate } });
    }
  };

  const renderWorkoutCard = ({ item }: { item: typeof workoutDays[0] }) => {
    const dayData = workouts[item.dateStr];
    const rawExercises: Exercise[] = dayData?.exercises || [];
    const isFinished = dayData?.isFinished || false;
    const isStarted = dayData?.isStarted || false;
    const isFuture = item.dateStr > todayStr;
    const isExpanded = expandedCards[item.id];

    const sortedExercises = [...rawExercises].sort((a, b) => {
      const indexA = GROUP_ORDER.indexOf(a.groupTitle || "Accessories");
      const indexB = GROUP_ORDER.indexOf(b.groupTitle || "Accessories");
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    const displayList = isExpanded ? sortedExercises : sortedExercises.slice(0, 3);
    let lastGroupHeader = "";

    const formatMeta = (ex: Exercise) => {
    const repsPart = Array.isArray(ex.reps) ? ex.reps.join(',') : ex.reps;
    const unitPart = ex.repUnit ? ` ${ex.repUnit}` : '';
    return `${ex.sets}x${repsPart}${unitPart}`;
    };

    return (
      <View style={styles.cardContainer}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitleText}>{item.dateLabel} • {item.fullDate}</Text></View>
        
        <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item.id)} style={[styles.workoutCard, isExpanded && { minHeight: 320 }]}>
          {rawExercises.length > 0 ? (
            <View style={styles.contentWrapper}>
              <View style={styles.exerciseArea}>
                <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={isExpanded}>
                  {displayList.map((ex, idx) => {
                    const currentGroup = ex.groupTitle || "General";
                    const showHeader = currentGroup !== lastGroupHeader;
                    lastGroupHeader = currentGroup;

                    return (
                      <View key={ex.id}>
                        {showHeader && <Text style={styles.groupLabel}>{currentGroup.toUpperCase()}</Text>}
                        <View style={styles.miniExerciseRow}>
                          <View style={[styles.redDot, isFinished && { backgroundColor: '#34C759' }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.miniExName, isFinished && { color: '#888' }]} numberOfLines={1}>{ex.name}</Text>
                            <Text style={styles.miniExMeta}>{formatMeta(ex)}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {!isExpanded && rawExercises.length > 3 && (
                    <Text style={styles.moreIndicator}>+ {rawExercises.length - 3} more. Tap to expand.</Text>
                  )}
                </ScrollView>
              </View>

              <View style={styles.buttonWrapper}>
                {isFinished ? (
                  <TouchableOpacity style={styles.completedBadge} onPress={() => { setSelectedRedoDate(item.dateStr); setRedoModalVisible(true); }}>
                    <Text style={styles.completedBadgeText}>Session Complete</Text>
                    <Ionicons name="refresh-circle" size={20} color="#FFF" />
                  </TouchableOpacity>
                ) : isFuture ? (
                  <TouchableOpacity style={[styles.startWorkoutBtn, { backgroundColor: '#F2F2F7' }]} onPress={() => router.push({ pathname: '/workouts', params: { date: item.dateStr } })}>
                    <Text style={[styles.startWorkoutBtnText, { color: '#000' }]}>Edit Plan</Text>
                    <Ionicons name="pencil" size={16} color="#000" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.startWorkoutBtn, isStarted && { backgroundColor: '#c62828' }]} onPress={() => router.push('/(main)/active-workout')}>
                    <Text style={styles.startWorkoutBtnText}>{isStarted ? "Resume Workout" : "Start Workout"}</Text>
                    <Ionicons name={isStarted ? "refresh" : "play"} size={16} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyContent}>
              <View style={styles.iconCircle}><Ionicons name="barbell-outline" size={32} color="#AAA" /></View>
              <Text style={styles.noWorkoutText}>No workout planned</Text>
              <TouchableOpacity style={styles.planButton} onPress={() => router.push({ pathname: '/workouts', params: { date: item.dateStr } })}><Text style={styles.planButtonText}>Plan Session</Text></TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingContainer}>
          <Text style={styles.welcomeText}>Hi {fullName.split(' ')[0]},</Text>
          <Text style={styles.subtitleText}>Consistency is the key to progress.</Text>
        </View>
        <FlatList data={workoutDays} renderItem={renderWorkoutCard} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))} snapToAlignment="center" keyExtractor={(item) => item.id} />
        <View style={styles.paginationDots}>{workoutDays.map((_, i) => <View key={i} style={[styles.dot, activeIndex === i ? styles.activeDot : styles.inactiveDot]} />)}</View>
        <TouchableOpacity style={styles.plansButton} onPress={() => router.push('/(main)/programs')} activeOpacity={0.8}><View style={styles.buttonIconCircle}><Ionicons name="list" size={24} color="#c62828" /></View><View style={styles.buttonTextContainer}><Text style={styles.buttonTitle}>Choose Training Plan</Text><Text style={styles.buttonSubtitle}>Get a customized 4-week protocol</Text></View><Ionicons name="chevron-forward" size={20} color="#FFF" /></TouchableOpacity>
      </ScrollView>

      {/* REDO MODAL */}
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

      <OnboardingModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 25, paddingBottom: 40 },
  greetingContainer: { paddingHorizontal: 20, marginBottom: 20 },
  welcomeText: { fontSize: 28, fontWeight: '900' },
  subtitleText: { fontSize: 15, color: '#666', marginTop: 5 },
  cardContainer: { width: width, paddingHorizontal: 20 },
  sectionHeader: { marginBottom: 12 },
  sectionTitleText: { fontSize: 13, fontWeight: '700', color: '#8e8e93', letterSpacing: 1 },
  workoutCard: { backgroundColor: '#FFF', borderRadius: 25, minHeight: 280, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  contentWrapper: { flex: 1, justifyContent: 'space-between' },
  exerciseArea: { flex: 1 },
  groupLabel: { fontSize: 9, fontWeight: '900', color: '#AAA', marginBottom: 8, letterSpacing: 1, marginTop: 5 },
  miniExerciseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c62828', marginRight: 12 },
  miniExName: { fontSize: 15, fontWeight: '600' },
  miniExMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  moreIndicator: { fontSize: 11, color: '#c62828', fontWeight: '700', marginTop: 5, textAlign: 'center' },
  buttonWrapper: { marginTop: 15 },
  startWorkoutBtn: { backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 15, gap: 8 },
  startWorkoutBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  completedBadge: { backgroundColor: '#34C759', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 15, gap: 8 },
  completedBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  noWorkoutText: { fontSize: 16, color: '#999', fontWeight: '500', marginBottom: 15 },
  planButton: { backgroundColor: '#F2F2F7', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  planButtonText: { color: '#000', fontWeight: 'bold' },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, marginBottom: 30 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  activeDot: { width: 20, backgroundColor: '#c62828' },
  inactiveDot: { width: 8, backgroundColor: '#DDD' },
  plansButton: { marginHorizontal: 20, backgroundColor: '#c62828', flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 25, elevation: 5 },
  buttonIconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  buttonTextContainer: { flex: 1, marginLeft: 15 },
  buttonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  buttonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  confirmBox: { backgroundColor: '#FFF', borderRadius: 25, width: width - 60, padding: 25, alignItems: 'center' },
  confirmIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  confirmSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25 },
  confirmFinishBtn: { backgroundColor: '#c62828', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmFinishText: { color: '#FFF', fontWeight: 'bold' },
});