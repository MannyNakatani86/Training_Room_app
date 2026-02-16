import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const DEFAULT_EXERCISES = [
  "Bench Press", "Back Squat", "Front Squat", "Incline Bench Press",
  "Deadlift", "Clean", "Snatch", "Hang Clean", "Hang Snatch",
  "Block Clean", "Block Snatch", "Push Press", "Power Jerk",
  "Split Jerk", "Trap Bar Deadlift"
];

export default function RegisteredExercisesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [isAscending, setIsAscending] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        // Create initial map with 15 defaults
        const map: any = {};
        DEFAULT_EXERCISES.forEach(ex => {
          map[ex] = { name: ex, lastDate: null, timestamp: 0 };
        });

        const querySnapshot = await getDocs(query(collection(db, "customers", user.uid, "workouts")));
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.exercises) {
            data.exercises.forEach((ex: any) => {
              const name = ex.name.trim();
              const dateTs = new Date(doc.id).getTime();
              if (!map[name] || dateTs > map[name].timestamp) {
                map[name] = { name, lastDate: doc.id, timestamp: dateTs };
              }
            });
          }
        });
        setExercises(Object.values(map));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const sorted = [...exercises].sort((a, b) => {
    let res = sortBy === 'name' ? a.name.localeCompare(b.name) : a.timestamp - b.timestamp;
    return isAscending ? res : -res;
  });

  if (loading) return <View style={styles.center}><ActivityIndicator color="#c62828" size="large" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.controls}>
        <Text style={styles.count}>{exercises.length} Total</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.miniBtn} onPress={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}>
            <Text style={styles.miniBtnText}>{sortBy === 'name' ? 'A-Z' : 'By Date'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniBtn} onPress={() => setIsAscending(!isAscending)}>
            <Ionicons name={isAscending ? "arrow-up" : "arrow-down"} size={14} color="#c62828" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.row} 
            onPress={() => router.push({ pathname: '/(main)/exercise-history', params: { exerciseName: item.name } })}
          >
            <View style={styles.icon}><Ionicons name="barbell" size={18} color="#c62828" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.date, !item.lastDate && { color: '#CCC' }]}>
                {item.lastDate ? `Last recorded: ${item.lastDate}` : 'Not performed yet'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  count: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  miniBtn: { backgroundColor: '#FFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', flexDirection: 'row', alignItems: 'center' },
  miniBtnText: { fontSize: 11, fontWeight: '700', color: '#444' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  name: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 12, color: '#999', marginTop: 2 }
});