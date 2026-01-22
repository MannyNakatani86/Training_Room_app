import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const selectedStr = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    setWeekDates(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    }));
  }, []);

  const toggleCalendar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Format date for the preview title
  const formattedDate = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 1. CALENDAR HEADER (Canvas Style) */}
        <View style={styles.calendarHeaderCard}>
          <View style={styles.topMeta}>
            <View>
              <Text style={styles.yearText}>{selectedDate.getFullYear()}</Text>
              <TouchableOpacity style={styles.monthSelector} onPress={toggleCalendar}>
                <Text style={styles.monthText}>
                  {selectedDate.toLocaleString('default', { month: 'long' })}
                </Text>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#444" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity><Text style={styles.calendarsLink}>Calendars</Text></TouchableOpacity>
          </View>

          {isExpanded ? (
            <Calendar
              current={selectedStr}
              onDayPress={day => setSelectedDate(new Date(day.dateString))}
              markedDates={{
                [todayStr]: { marked: true, dotColor: '#c62828' },
                [selectedStr]: { selected: true, selectedColor: '#c62828' }
              }}
              theme={{
                todayTextColor: '#c62828',
                selectedDayBackgroundColor: '#c62828',
                textDayFontWeight: '400',
              } as any}
            />
          ) : (
            <View style={styles.weekStrip}>
              {weekDates.map((date, i) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <TouchableOpacity key={i} style={styles.dayCol} onPress={() => setSelectedDate(date)}>
                    <Text style={styles.dayLabel}>{date.toLocaleString('default', { weekday: 'short' })}</Text>
                    <View style={[styles.dateCircle, isSelected && styles.selectedCircle]}>
                      <Text style={[styles.dateNum, isSelected && styles.selectedDateNum]}>{date.getDate()}</Text>
                    </View>
                    {isToday && !isSelected && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 2. WORKOUT PREVIEW SECTION */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionHeader}>Workout for {formattedDate}</Text>
          
          <View style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>Full Body Hypertrophy</Text>
              <View style={styles.tag}><Text style={styles.tagText}>Intensity: High</Text></View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.exerciseList}>
              <ExerciseRow name="Barbell Back Squats" sets="4 Sets" reps="8-10 Reps" />
              <ExerciseRow name="Bench Press" sets="3 Sets" reps="12 Reps" />
              <ExerciseRow name="Weighted Pull-Ups" sets="3 Sets" reps="To Failure" />
              <ExerciseRow name="Deadlifts" sets="3 Sets" reps="5 Reps" />
            </View>

            <Text style={styles.noteText}>Note: Focus on 2-second eccentric phase for all movements today.</Text>
          </View>
        </View>

        {/* Extra space so scrolling doesn't hide content behind the button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 3. STICKY START LIFTING BUTTON */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.9}>
          <Ionicons name="fitness" size={20} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.startButtonText}>Start Lifting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper component for Exercise Rows
function ExerciseRow({ name, sets, reps }: { name: string, sets: string, reps: string }) {
  return (
    <View style={styles.exerciseRow}>
      <Ionicons name="checkmark-circle-outline" size={18} color="#c62828" style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>{name}</Text>
        <Text style={styles.exerciseDetails}>{sets} • {reps}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Calendar styles
  calendarHeaderCard: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  topMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, marginBottom: 15 },
  yearText: { fontSize: 12, color: '#888' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  monthText: { fontSize: 22, fontWeight: '400', color: '#000', marginRight: 5 },
  calendarsLink: { color: '#c62828', fontSize: 16, marginTop: 15 },
  
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  dayCol: { alignItems: 'center', width: 40 },
  dayLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  dateCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  selectedCircle: { backgroundColor: '#c62828' },
  dateNum: { fontSize: 16, color: '#333' },
  selectedDateNum: { color: '#fff', fontWeight: 'bold' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#c62828', marginTop: 4 },

  // Preview styles
  previewSection: { padding: 20 },
  sectionHeader: { fontSize: 14, fontWeight: '600', color: '#666', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 0.5 },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  workoutTitle: { fontSize: 20, fontWeight: '400', color: '#c62828', flex: 1 },
  tag: { backgroundColor: '#f0f7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagText: { color: '#c62828', fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 15 },
  exerciseList: { marginBottom: 15 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exerciseName: { fontSize: 16, color: '#333', fontWeight: '500' },
  exerciseDetails: { fontSize: 13, color: '#888', marginTop: 2 },
  noteText: { fontSize: 13, color: '#888', fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#f9f9f9', paddingTop: 10 },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  startButton: {
    backgroundColor: '#c62828',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c62828',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});