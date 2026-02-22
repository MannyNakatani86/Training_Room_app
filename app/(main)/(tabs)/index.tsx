import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from './_layout';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { fullName } = useUser();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  // We now store the whole workout object to check isFinished
  const [workouts, setWorkouts] = useState<Record<string, any>>({});

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

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
        setWorkouts(prev => ({ 
          ...prev, 
          [day.dateStr]: docSnap.exists() ? docSnap.data() : null 
        }));
      });
    });
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const renderWorkoutCard = ({ item }: { item: typeof workoutDays[0] }) => {
    const dayData = workouts[item.dateStr];
    const dayExercises: Exercise[] = dayData?.exercises || [];
    const isFinished = dayData?.isFinished || false;
    const previewList = dayExercises.slice(0, 3);
    const hasMore = dayExercises.length > 3;

    return (
      <View style={styles.cardContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleText}>{item.dateLabel} • {item.fullDate}</Text>
        </View>
        <View style={styles.workoutCardFixed}>
          {dayExercises.length > 0 ? (
            <View style={styles.contentWrapper}>
              <View style={styles.exercisePreviewArea}>
                {previewList.map((ex, idx) => (
                  <View key={idx} style={styles.miniExerciseRow}>
                    <View style={[styles.redDot, isFinished && { backgroundColor: '#34C759' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.miniExName, isFinished && { color: '#888' }]} numberOfLines={1}>{ex.name}</Text>
                      <Text style={styles.miniExMeta}>
                        {ex.sets} Sets • {Array.isArray(ex.reps) ? ex.reps.join(', ') : ex.reps} Reps
                      </Text>
                    </View>
                  </View>
                ))}
                {hasMore && <Text style={styles.moreIndicator}>+ {dayExercises.length - 3} more</Text>}
              </View>

              {isFinished ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>Session Complete</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                </View>
              ) : (
                <TouchableOpacity style={styles.startWorkoutBtn} onPress={() => router.push('/(main)/active-workout')}>
                  <Text style={styles.startWorkoutBtnText}>Start Workout</Text>
                  <Ionicons name="play" size={16} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyContent}>
              <View style={styles.iconCircle}><Ionicons name="barbell-outline" size={32} color="#AAA" /></View>
              <Text style={styles.noWorkoutText}>No workout planned</Text>
              <TouchableOpacity style={styles.planButton} onPress={() => router.push('/workouts')}><Text style={styles.planButtonText}>Plan Session</Text></TouchableOpacity>
            </View>
          )}
        </View>
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

        <FlatList data={workoutDays} renderItem={renderWorkoutCard} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} snapToAlignment="center" keyExtractor={(item) => item.id} />

        <View style={styles.paginationDots}>
          {workoutDays.map((_, i) => <View key={i} style={[styles.dot, activeIndex === i ? styles.activeDot : styles.inactiveDot]} />)}
        </View>

        <TouchableOpacity style={styles.plansButton} onPress={() => router.push('/(main)/programs')} activeOpacity={0.8}>
          <View style={styles.buttonIconCircle}><Ionicons name="list" size={24} color="#c62828" /></View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Choose Training Plan</Text>
            <Text style={styles.buttonSubtitle}>Get a customized 4-week protocol</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
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
  workoutCardFixed: { backgroundColor: '#FFF', borderRadius: 25, height: 280, padding: 20, elevation: 3, justifyContent: 'center' },
  contentWrapper: { flex: 1, justifyContent: 'space-between' },
  exercisePreviewArea: { flex: 1, paddingTop: 5 },
  miniExerciseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c62828', marginRight: 12 },
  miniExName: { fontSize: 16, fontWeight: '600' },
  miniExMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  moreIndicator: { fontSize: 12, color: '#AAA', marginLeft: 18, fontStyle: 'italic' },
  startWorkoutBtn: { backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 15, gap: 8 },
  startWorkoutBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  completedBadge: { backgroundColor: '#34C759', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 15, gap: 8 },
  completedBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  emptyContent: { alignItems: 'center' },
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
});