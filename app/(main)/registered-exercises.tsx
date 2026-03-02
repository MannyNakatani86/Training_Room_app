import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from './_layout';

const DEFAULT_EXERCISES = ["Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", "Deadlift", "Clean", "Snatch", "Hang Clean", "Hang Snatch", "Block Clean", "Block Snatch", "Push Press", "Power Jerk", "Split Jerk", "Trap Bar Deadlift"];

export default function RegisteredExercisesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unit } = useUser(); 
  
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const map: any = {};
      // Initialize with defaults
      DEFAULT_EXERCISES.forEach(ex => {
        map[ex] = { name: ex, lastDate: null, prWeight: 0, prDate: null, timestamp: 0 };
      });

      const querySnapshot = await getDocs(query(collection(db, "customers", user.uid, "workouts")));
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dateStr = doc.id; 
        const dateTs = new Date(dateStr).getTime();

        if (data.exercises) {
          data.exercises.forEach((ex: any) => {
            const name = ex.name.trim();
            if (!map[name]) {
                map[name] = { name, lastDate: null, prWeight: 0, prDate: null, timestamp: 0 };
            }

            if (dateTs > map[name].timestamp) {
              map[name].lastDate = dateStr;
              map[name].timestamp = dateTs;
            }

            if (ex.loggedWeights && Array.isArray(ex.loggedWeights)) {
              ex.loggedWeights.forEach((w: string) => {
                const weight = parseFloat(w) || 0;
                if (weight > map[name].prWeight) {
                  map[name].prWeight = weight;
                  map[name].prDate = dateStr; 
                }
              });
            }
          });
        }
      });
      setExercises(Object.values(map));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- UPDATED: HIT ON RETURN '--' LOGIC ---
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--'; // Your requested change
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: '2-digit' 
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={26} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>
      ) : (
        <FlatList
          data={exercises.sort((a,b) => a.name.localeCompare(b.name))}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity 
                  style={styles.clickableArea}
                  onPress={() => router.push({ pathname: '/(main)/exercise-history', params: { exerciseName: item.name } })}
              >
                  <View style={styles.iconBox}><Ionicons name="barbell" size={20} color="#c62828" /></View>
                  
                  <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      
                      <View style={styles.statsRow}>
                          <View style={styles.statDetail}>
                              <Text style={styles.statLabel}>PR</Text>
                              {/* Using '--' if weight is 0 to match your date logic */}
                              <Text style={styles.statValue}>{item.prWeight > 0 ? `${item.prWeight}${unit}` : '--'}</Text>
                          </View>
                          <View style={styles.statDivider} />
                          <View style={styles.statDetail}>
                              <Text style={styles.statLabel}>HIT ON</Text>
                              <Text style={styles.statValue}>{formatDate(item.prDate)}</Text>
                          </View>
                      </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  row: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  clickableArea: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  name: { fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statDetail: { marginRight: 15 },
  statLabel: { fontSize: 9, fontWeight: '900', color: '#AAA', letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#444' },
  statDivider: { width: 1, height: 15, backgroundColor: '#EEE', marginRight: 15 },
});