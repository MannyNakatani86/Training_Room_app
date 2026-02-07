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

interface RegisteredExercise {
  name: string;
  lastDate: string;
  timestamp: number;
}

export default function RegisteredExercisesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [exercises, setExercises] = useState<RegisteredExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [isAscending, setIsAscending] = useState(true);

  useEffect(() => {
    const fetchAllExercises = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const workoutsRef = collection(db, "customers", user.uid, "workouts");
        const querySnapshot = await getDocs(query(workoutsRef));
        const exerciseMap: Record<string, RegisteredExercise> = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const dateStr = doc.id; 
          const dateObj = new Date(dateStr);
          if (data.exercises && Array.isArray(data.exercises)) {
            data.exercises.forEach((ex: any) => {
              const name = ex.name.trim();
              if (!exerciseMap[name] || dateObj.getTime() > exerciseMap[name].timestamp) {
                exerciseMap[name] = { name, lastDate: dateStr, timestamp: dateObj.getTime() };
              }
            });
          }
        });
        setExercises(Object.values(exerciseMap));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllExercises();
  }, []);

  const sortedExercises = [...exercises].sort((a, b) => {
    let comparison = sortBy === 'name' ? a.name.localeCompare(b.name) : a.timestamp - b.timestamp;
    return isAscending ? comparison : -comparison;
  });

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#c62828" /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={26} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.controlsRow}>
        <Text style={styles.resultsCount}>{exercises.length} Exercises</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.miniBtn} onPress={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}>
            <Ionicons name="filter-outline" size={14} color="#666" style={{ marginRight: 6 }} />
            <Text style={styles.miniBtnText}>{sortBy === 'name' ? 'Name' : 'Date'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.directionBtn} onPress={() => setIsAscending(!isAscending)}>
            <Ionicons name={isAscending ? "arrow-up" : "arrow-down"} size={14} color="#c62828" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedExercises}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.exerciseRow} 
            onPress={() => router.push({
              pathname: '/(main)/exercise-history',
              params: { exerciseName: item.name }
            })}
          >
            <View style={styles.iconBox}><Ionicons name="barbell" size={18} color="#c62828" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseDate}>Last recorded: {item.lastDate}</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  resultsCount: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  buttonGroup: { flexDirection: 'row', gap: 6 },
  miniBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#DDD' },
  miniBtnText: { fontSize: 11, fontWeight: '700', color: '#555' },
  directionBtn: { backgroundColor: '#FFF', width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  listContent: { paddingHorizontal: 15, paddingBottom: 40 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: '#000' },
  exerciseDate: { fontSize: 11, color: '#999', marginTop: 1 },
});