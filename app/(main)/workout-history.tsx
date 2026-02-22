import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutHistoryEntry {
  id: string;
  date: string;
  readinessScore?: number;
  sorenessScore?: number;
  sessionTonnage?: number;
  exercises: any[];
}

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Timezone-safe date formatter
  const formatDateSafe = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const workoutsRef = collection(db, "customers", user.uid, "workouts");
        // Fetch only finished workouts, newest first
        const q = query(workoutsRef, where("isFinished", "==", true));
        const querySnapshot = await getDocs(q);
        
        const results: WorkoutHistoryEntry[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, date: doc.id, ...doc.data() } as WorkoutHistoryEntry);
        });

        // Sort by date string descending
        results.sort((a, b) => b.date.localeCompare(a.date));
        setHistory(results);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            {/* DATE & TONNAGE HEADER */}
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{formatDateSafe(item.date)}</Text>
              <View style={styles.tonnageBadge}>
                <Text style={styles.tonnageText}>{(item.sessionTonnage || 0).toLocaleString()} kg</Text>
              </View>
            </View>

            {/* READINESS & SORENESS SCORES */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Ionicons name="flash" size={14} color="#FF9500" />
                <Text style={styles.scoreLabel}>Readiness: <Text style={styles.scoreValue}>{item.readinessScore || '-'}/10</Text></Text>
              </View>
              <View style={styles.scoreItem}>
                <Ionicons name="thermometer" size={14} color="#FF3B30" />
                <Text style={styles.scoreLabel}>Soreness: <Text style={styles.scoreValue}>{item.sorenessScore || '-'}/10</Text></Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* EXERCISES & MEMOS */}
            <View style={styles.exerciseSection}>
              {item.exercises.map((ex, idx) => (
                <View key={idx} style={styles.exerciseItem}>
                  <View style={styles.exerciseMain}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseSets}>{ex.sets} sets completed</Text>
                  </View>
                  {ex.memo ? (
                    <View style={styles.memoBox}>
                      <Ionicons name="document-text-outline" size={12} color="#888" />
                      <Text style={styles.memoText}>{ex.memo}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E5E7'
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },

  listContent: { padding: 20 },
  historyCard: { 
    backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 15,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 16, fontWeight: '800', color: '#000' },
  tonnageBadge: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tonnageText: { fontSize: 12, fontWeight: 'bold', color: '#c62828' },

  scoreRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  scoreItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scoreLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  scoreValue: { color: '#333' },

  divider: { height: 1, backgroundColor: '#F2F2F7', marginBottom: 12 },

  exerciseSection: { gap: 12 },
  exerciseItem: { marginBottom: 5 },
  exerciseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 15, fontWeight: '700', color: '#333' },
  exerciseSets: { fontSize: 12, color: '#888' },
  
  memoBox: { 
    flexDirection: 'row', gap: 6, backgroundColor: '#F9F9FB', 
    padding: 8, borderRadius: 8, marginTop: 5, borderLeftWidth: 3, borderLeftColor: '#DDD' 
  },
  memoText: { fontSize: 12, color: '#666', fontStyle: 'italic', flex: 1 },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#999', marginTop: 10 }
});