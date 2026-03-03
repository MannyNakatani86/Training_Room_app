import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WorkoutHistoryEntry {
  id: string;
  date: string;
  readinessScore?: number;
  sorenessScore?: number;
  sessionTonnage?: number;
  sessionMemo?: string;
  exercises: any[];
}

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDateSafe = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const workoutsRef = collection(db, "customers", user.uid, "workouts");
        const q = query(workoutsRef, where("isFinished", "==", true));
        const querySnapshot = await getDocs(q);
        const results: WorkoutHistoryEntry[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, date: doc.id, ...doc.data() } as WorkoutHistoryEntry);
        });
        results.sort((a, b) => b.date.localeCompare(a.date));
        setHistory(results);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchHistory();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={26} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Session History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <HistoryItem item={item} formatDateSafe={formatDateSafe} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={50} color="#DDD" />
            <Text style={styles.emptyText}>No completed sessions yet.</Text>
          </View>
        }
      />
    </View>
  );
}

// Separate component for each card to handle internal "expanded" state
function HistoryItem({ item, formatDateSafe }: { item: WorkoutHistoryEntry, formatDateSafe: Function }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.historyCard}>
      {/* 1. HEADER (Date & Tonnage) */}
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDateSafe(item.date)}</Text>
        <View style={styles.tonnageBadge}>
          <Text style={styles.tonnageText}>{(item.sessionTonnage || 0).toLocaleString()} kg</Text>
        </View>
      </View>

      {/* 2. READINESS & SORENESS */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreItem}>
          <Ionicons name="flash" size={14} color="#FF9500" />
          <Text style={styles.scoreLabel}>Ready: <Text style={styles.scoreValue}>{item.readinessScore || '-'}</Text></Text>
        </View>
        <View style={styles.scoreItem}>
          <Ionicons name="thermometer" size={14} color="#FF3B30" />
          <Text style={styles.scoreLabel}>Sore: <Text style={styles.scoreValue}>{item.sorenessScore || '-'}</Text></Text>
        </View>
      </View>

      {/* 3. SESSION MEMO (Prominent) */}
      <View style={styles.sessionMemoBox}>
        <Text style={styles.sessionMemoText}>
          {item.sessionMemo ? `"${item.sessionMemo}"` : "No session notes recorded."}
        </Text>
      </View>

      {/* 4. EXPAND BUTTON */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleExpand} activeOpacity={0.7}>
        <Text style={styles.expandBtnText}>{isExpanded ? "Hide Exercises" : "Show Exercises"}</Text>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#c62828" />
      </TouchableOpacity>

      {/* 5. HIDDEN EXERCISE LIST */}
      {isExpanded && (
        <View style={styles.exerciseSection}>
          <View style={styles.divider} />
          {item.exercises.map((ex: any, idx: number) => (
            <View key={idx} style={styles.exerciseItem}>
              <View style={styles.exerciseMain}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseSets}>{ex.sets} sets completed</Text>
              </View>
              {ex.memo ? (
                <View style={styles.exerciseMemoBox}>
                  <Text style={styles.exerciseMemoText}>{ex.memo}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5E7' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  listContent: { padding: 20 },
  
  historyCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 16, fontWeight: '800' },
  tonnageBadge: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tonnageText: { fontSize: 12, fontWeight: 'bold', color: '#c62828' },
  
  scoreRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
  scoreItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scoreLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  scoreValue: { color: '#333' },

  sessionMemoBox: { backgroundColor: '#F9F9FB', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#c62828' },
  sessionMemoText: { fontSize: 14, color: '#333', fontStyle: 'italic', lineHeight: 20 },

  // Expand Button Styles
  expandBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingVertical: 5 },
  expandBtnText: { fontSize: 13, fontWeight: '700', color: '#c62828', marginRight: 5 },

  // Exercise List (Hidden by default)
  exerciseSection: { marginTop: 10 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginBottom: 15 },
  exerciseItem: { marginBottom: 12 },
  exerciseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#333' },
  exerciseSets: { fontSize: 12, color: '#888' },
  exerciseMemoBox: { backgroundColor: '#F2F2F7', padding: 8, borderRadius: 8, marginTop: 5 },
  exerciseMemoText: { fontSize: 12, color: '#666', fontStyle: 'italic' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 10 }
});