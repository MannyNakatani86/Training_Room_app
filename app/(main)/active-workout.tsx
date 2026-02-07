import { auth, db } from '@/fireBaseConfig';
import { Exercise } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishModalVisible, setFinishModalVisible] = useState(false);

  const getFormattedStr = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, "customers", user.uid, "workouts", getFormattedStr(new Date())), (docSnap) => {
      if (docSnap.exists()) {
        setExercises(docSnap.data().exercises || []);
      } else {
        router.replace('/(main)/(tabs)');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- LOGIC: Group exercises by their groupTitle ---
  const groupedExercises = exercises.reduce((groups: { [key: string]: Exercise[] }, ex) => {
    const title = ex.groupTitle || "General Exercises";
    if (!groups[title]) groups[title] = [];
    groups[title].push(ex);
    return groups;
  }, {});

  const groupNames = Object.keys(groupedExercises);

  const finishWorkoutSession = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const docRef = doc(db, "customers", user.uid, "workouts", getFormattedStr(new Date()));
      await updateDoc(docRef, { isFinished: true, finishedAt: new Date() });
      setFinishModalVisible(false);
      router.replace('/(main)/(tabs)');
    } catch (error) {
      Alert.alert("Error", "Could not save results.");
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>ACTIVE SESSION</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {groupNames.map((groupName, gIndex) => (
          <View key={groupName} style={styles.groupContainer}>
            
            {/* 1. WHITE HEADER BOX FOR THE GROUP */}
            <View style={styles.groupHeaderBox}>
              <Text style={styles.groupHeaderText}>{groupName.toUpperCase()}</Text>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={18} color="#AAA" />
              </TouchableOpacity>
            </View>

            {/* 2. EXERCISES INSIDE THIS GROUP */}
            <View style={styles.exercisesListInsideGroup}>
              {groupedExercises[groupName].map((ex, exIndex) => {
                const hasLogs = ex.loggedWeights && ex.loggedWeights.some((w: string) => w !== '');
                return (
                  <TouchableOpacity 
                    key={ex.id} 
                    style={[styles.exerciseRow, exIndex === groupedExercises[groupName].length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => router.push({
                      pathname: '/(main)/log-exercise',
                      params: { exerciseId: ex.id, exerciseName: ex.name, sets: ex.sets, reps: ex.reps }
                    })}
                  >
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exName, hasLogs && styles.textDone]}>{ex.name}</Text>
                      <Text style={styles.exMeta}>{ex.sets} Sets • {Array.isArray(ex.reps) ? ex.reps.join(', ') : ex.reps} Reps</Text>
                    </View>
                    <View style={[styles.statusCircle, hasLogs && styles.statusCircleDone]}>
                      <Ionicons 
                        name={hasLogs ? "checkmark" : "chevron-forward"} 
                        size={16} 
                        color={hasLogs ? "#FFF" : "#CCC"} 
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. VERTICAL LINE BETWEEN GROUPS */}
            {gIndex < groupNames.length - 1 && (
              <View style={styles.lineWrapper}>
                <View style={styles.verticalLine} />
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.finishBtn} onPress={() => setFinishModalVisible(true)}>
          <Text style={styles.finishBtnText}>FINISH WORKOUT</Text>
        </TouchableOpacity>
      </View>

      {/* FINISH MODAL */}
      <Modal visible={finishModalVisible} animationType="fade" transparent={true}>
        <View style={styles.centerModalOverlay}>
          <View style={styles.confirmBox}>
            <Ionicons name="trophy-outline" size={50} color="#c62828" style={{ marginBottom: 15 }} />
            <Text style={styles.confirmTitle}>Finish Workout?</Text>
            <TouchableOpacity style={styles.confirmFinishBtn} onPress={finishWorkoutSession}>
              <Text style={styles.confirmFinishText}>FINISH SESSION</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setFinishModalVisible(false)}>
              <Text style={{ color: '#666' }}>KEEP LIFTING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 1 },

  scrollContent: { padding: 20 },

  groupContainer: { width: '100%', alignItems: 'center' },

  // WHITE GROUP BOX
  groupHeaderBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  groupHeaderText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  // CONTAINER FOR EXERCISES
  exercisesListInsideGroup: {
    backgroundColor: '#FFF',
    width: '100%',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingHorizontal: 18,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  exerciseInfo: { flex: 1 },
  exName: { fontSize: 17, fontWeight: '700', color: '#000' },
  exMeta: { fontSize: 13, color: '#8E8E93', marginTop: 4, fontWeight: '500' },
  textDone: { color: '#AAA', textDecorationLine: 'none' },

  statusCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F9F9FB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  statusCircleDone: { backgroundColor: '#c62828', borderColor: '#c62828' },

  // LINE BETWEEN GROUPS
  lineWrapper: { height: 35, alignItems: 'center' },
  verticalLine: { width: 2, flex: 1, backgroundColor: '#D1D1D6' },

  footer: { paddingHorizontal: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 10 },
  finishBtn: { backgroundColor: '#000', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  confirmBox: { backgroundColor: '#FFF', borderRadius: 25, width: '100%', padding: 25, alignItems: 'center' },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  confirmFinishBtn: { backgroundColor: '#c62828', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  confirmFinishText: { color: '#FFF', fontWeight: 'bold' }
});