import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query } from 'firebase/firestore';
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

interface HistoryEntry {
  date: string;
  weights: string[];
  sets: string;
  reps: any;
  memo?: string; // Added memo to interface
}

export default function ExerciseHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDateSafe = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const workoutsRef = collection(db, "customers", user.uid, "workouts");
        const querySnapshot = await getDocs(query(workoutsRef));
        const results: HistoryEntry[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.exercises) {
            const match = data.exercises.find((ex: any) => ex.name === exerciseName);
            if (match) {
              results.push({
                date: doc.id,
                weights: match.loggedWeights || [],
                sets: match.sets,
                reps: match.reps,
                memo: match.memo || '' // Fetch the memo
              });
            }
          }
        });

        results.sort((a, b) => b.date.localeCompare(a.date));
        setHistory(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [exerciseName]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={26} color="#000" /></TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Exercise History</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{exerciseName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{formatDateSafe(item.date)}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.sets}x{Array.isArray(item.reps) ? item.reps.join(', ') : item.reps}
                </Text>
              </View>
            </View>
            
            <View style={styles.weightContainer}>
              {item.weights.map((w, idx) => (
                <View key={idx} style={styles.weightBox}>
                  <Text style={styles.weightLabel}>Set {idx + 1}</Text>
                  <Text style={styles.weightValue}>{w || '-'}<Text style={styles.unitText}>kg</Text></Text>
                </View>
              ))}
            </View>

            {/* DISPLAY THE HISTORICAL MEMO */}
            {item.memo ? (
              <View style={styles.memoBox}>
                <Ionicons name="document-text-outline" size={14} color="#8E8E93" />
                <Text style={styles.memoText}>{item.memo}</Text>
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerSubtitle: { fontSize: 10, color: '#888', fontWeight: 'bold', textTransform: 'uppercase' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  listContent: { padding: 20 },
  historyCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateText: { fontSize: 15, fontWeight: '700', color: '#333' },
  badge: { backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#c62828', fontSize: 12, fontWeight: 'bold' },
  weightContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  weightBox: { backgroundColor: '#F9F9FB', padding: 10, borderRadius: 12, minWidth: 70, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0' },
  weightLabel: { fontSize: 10, color: '#AAA', fontWeight: 'bold' },
  weightValue: { fontSize: 16, fontWeight: '900', color: '#000' },
  unitText: { fontSize: 10, color: '#888', marginLeft: 2 },
  memoBox: { marginTop: 10, padding: 12, backgroundColor: '#F9F9FB', borderRadius: 10, flexDirection: 'row', gap: 8, borderLeftWidth: 3, borderLeftColor: '#EEE' },
  memoText: { fontSize: 13, color: '#666', fontStyle: 'italic', flex: 1 }
});