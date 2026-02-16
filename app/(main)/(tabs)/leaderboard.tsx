import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from './_layout';

const { width } = Dimensions.get('window');

const EXERCISE_LIST = [
  "Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", 
  "Deadlift", "Clean", "Snatch", "Hang Clean", "Hang Snatch", 
  "Block Clean", "Block Snatch", "Push Press", "Power Jerk", 
  "Split Jerk", "Trap Bar Deadlift"
];

// --- BOTH LISTS ARE NOW EMPTY ---
const GLOBAL_LEADERBOARD: any[] = []; 
const FRIENDS_LEADERBOARD: any[] = [];

export default function LeaderboardScreen() {
  const { fullName } = useUser();
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_LIST[0]);

  const isFriendsEmpty = FRIENDS_LEADERBOARD.length === 0;
  const isGlobalEmpty = GLOBAL_LEADERBOARD.length === 0;

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: 'Join me in the Training Room! Track your workouts and compete with me: https://trainingroom.app/invite',
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP TAB SWITCHER */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'local' && styles.activeTab]} 
            onPress={() => setActiveTab('local')}
          >
            <Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'global' && styles.activeTab]} 
            onPress={() => setActiveTab('global')}
          >
            <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>Global</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          styles.scrollContent, 
          // Center the empty states vertically
          ((activeTab === 'local' && isFriendsEmpty) || (activeTab === 'global' && isGlobalEmpty)) && { flex: 1 }
        ]}
      >
        
        {/* --- FRIENDS TAB --- */}
        {activeTab === 'local' && (
          isFriendsEmpty ? (
            <View style={styles.emptyCenterContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={60} color="#c62828" />
              </View>
              <Text style={styles.emptyTitle}>Train with Friends</Text>
              <Text style={styles.emptySubtitle}>
                Invite your friends to see their progress and compete on the local leaderboard.
              </Text>
              <TouchableOpacity style={styles.largeInviteBtn} onPress={handleInviteFriends}>
                <Text style={styles.largeInviteBtnText}>Invite your first friend</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
               <Text style={styles.sectionLabel}>Friends Ranking</Text>
            </View>
          )
        )}

        {/* --- GLOBAL TAB --- */}
        {activeTab === 'global' && (
          <View style={styles.globalContainer}>
            
            {/* EXERCISE SELECTOR */}
            <View style={styles.exerciseSelectorContainer}>
              <Text style={styles.sectionLabel}>Select Exercise</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseList}>
                {EXERCISE_LIST.map((ex) => (
                  <TouchableOpacity 
                    key={ex} 
                    style={[styles.exerciseChip, selectedExercise === ex && styles.activeChip]}
                    onPress={() => setSelectedExercise(ex)}
                  >
                    <Text style={[styles.chipText, selectedExercise === ex && styles.activeChipText]}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {isGlobalEmpty ? (
              /* GLOBAL EMPTY STATE */
              <View style={styles.emptyCenterContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="trophy-outline" size={60} color="#c62828" />
                </View>
                <Text style={styles.emptyTitle}>The Podium is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Be the first one to log your {selectedExercise} max and claim the #1 spot in the world!
                </Text>
                <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>Log your lift in the 'Workouts' tab to appear here.</Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.myRankContainer}>
                  <Text style={styles.sectionLabel}>Your {selectedExercise} Rank</Text>
                  <View style={styles.myRankCard}>
                    <View style={styles.rankInfo}>
                      <Text style={styles.myRankNumber}>#--</Text>
                      <View style={styles.divider} />
                      <View>
                        <Text style={styles.myName}>{fullName}</Text>
                        <Text style={styles.myPoints}>No max logged yet</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.listContainer}>
                  <Text style={styles.sectionLabel}>Top Performers</Text>
                  {/* List would map here */}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 20 },

  // Tab Switcher
  tabWrapper: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  activeTabText: { color: '#000' },

  // Exercise Selector
  exerciseSelectorContainer: { marginTop: 20, paddingLeft: 20 },
  exerciseList: { paddingRight: 20, paddingBottom: 5 },
  exerciseChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  activeChip: { backgroundColor: '#c62828', borderColor: '#c62828' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  activeChipText: { color: '#FFF' },

  // Global Container
  globalContainer: { flex: 1 },
  myRankContainer: { paddingHorizontal: 20, marginTop: 25, marginBottom: 30 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  myRankCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 15, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#c62828' },
  rankInfo: { flexDirection: 'row', alignItems: 'center' },
  myRankNumber: { fontSize: 22, fontWeight: '900', color: '#c62828', marginRight: 15 },
  divider: { width: 1, height: 30, backgroundColor: '#EEE', marginRight: 15 },
  myName: { fontSize: 16, fontWeight: '700', color: '#000' },
  myPoints: { fontSize: 13, color: '#666', marginTop: 2 },

  // List Rows
  listContainer: { paddingHorizontal: 20 },

  // Empty State (Local & Global)
  emptyCenterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F9F9FB', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#000', marginBottom: 10 },
  emptySubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  largeInviteBtn: { backgroundColor: '#c62828', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 15 },
  largeInviteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  instructionBox: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCC' },
  instructionText: { fontSize: 13, color: '#888', fontWeight: '500', textAlign: 'center' }
});