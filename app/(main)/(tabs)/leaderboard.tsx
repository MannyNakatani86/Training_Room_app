import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../_layout';

const { width } = Dimensions.get('window');
const EXERCISE_LIST = ["Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", "Deadlift", "Clean", "Snatch", "Hang Clean", "Hang Snatch", "Block Clean", "Block Snatch", "Push Press", "Power Jerk", "Split Jerk", "Trap Bar Deadlift"];

// --- MOCK DATA FOR FRIENDS (Currently Empty) ---
const FRIENDS_LEADERBOARD: any[] = []; 

export default function LeaderboardScreen() {
  const { fullName, unit } = useUser();
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_LIST[0]);
  
  const [globalData, setGlobalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isFriendsEmpty = FRIENDS_LEADERBOARD.length === 0;

  // 1. Fetch Real Global Data from Firestore
  useEffect(() => {
    if (activeTab === 'global') {
      setLoading(true);
      const unsub = onSnapshot(
        query(collection(db, "leaderboards", selectedExercise, "rankings"), orderBy("score", "desc")),
        (snapshot) => {
          const rankings = snapshot.docs.map(doc => doc.data());
          setGlobalData(rankings);
          setLoading(false);
        }
      );
      return () => unsub();
    }
  }, [selectedExercise, activeTab]);

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: 'Join me in the Training Room! Track your workouts and compete with me: https://trainingroom.app/invite',
      });
    } catch (error) {
      console.log(error);
    }
  };

  const formatWeight = (kg: number) => {
    if (unit === 'lbs') return `${Math.round(kg / 0.453592)} lbs`;
    return `${Math.round(kg)} kg`;
  };

  // Logic for Global Rank
  const top3 = globalData.slice(0, 3);
  const userIndex = globalData.findIndex(item => item.userId === auth.currentUser?.uid);
  const userRankData = userIndex !== -1 ? { ...globalData[userIndex], rank: userIndex + 1 } : null;

  return (
    <View style={styles.container}>
      {/* TABS SWITCHER */}
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
          activeTab === 'local' && isFriendsEmpty && { flex: 1 } // Allow centering
        ]}
      >
        
        {/* --- LOCAL / FRIENDS TAB --- */}
        {activeTab === 'local' && (
          isFriendsEmpty ? (
            /* CENTERED INVITE UI */
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
               {/* Friends list map would go here */}
            </View>
          )
        )}

        {/* --- GLOBAL TAB --- */}
        {activeTab === 'global' && (
          <View>
            {/* EXERCISE SELECTOR */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
              {EXERCISE_LIST.map(ex => (
                <TouchableOpacity key={ex} style={[styles.chip, selectedExercise === ex && styles.activeChip]} onPress={() => setSelectedExercise(ex)}>
                  <Text style={[styles.chipText, selectedExercise === ex && styles.activeChipText]}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.leaderboardWrapper}>
              {loading ? (
                <ActivityIndicator color="#c62828" style={{ marginTop: 50 }} />
              ) : (
                <>
                  {/* BAR 1: USER'S RANK */}
                  <Text style={styles.sectionLabel}>Your Standing</Text>
                  <View style={styles.userRankBar}>
                    <Text style={styles.rankNum}>#{userRankData ? userRankData.rank : '--'}</Text>
                    <View style={styles.avatarRed}><Ionicons name="person" size={16} color="#FFF" /></View>
                    <Text style={styles.nameText} numberOfLines={1}>{fullName} (You)</Text>
                    <Text style={styles.scoreText}>{userRankData ? formatWeight(userRankData.score) : '--'}</Text>
                  </View>

                  <View style={styles.dividerLarge} />

                  {/* BARS 2-4: TOP 3 */}
                  <Text style={styles.sectionLabel}>Top 3 Performers</Text>
                  {top3.length > 0 ? top3.map((user, index) => (
                    <View key={index} style={styles.rankBar}>
                      <Text style={[styles.rankNum, index === 0 && { color: '#FFD700' }]}>#{index + 1}</Text>
                      <View style={styles.avatarGray}><Ionicons name="person" size={16} color="#666" /></View>
                      <Text style={styles.nameText} numberOfLines={1}>{user.userName}</Text>
                      <Text style={styles.scoreText}>{formatWeight(user.score)}</Text>
                    </View>
                  )) : (
                    <Text style={styles.emptyText}>Be the first to log a {selectedExercise}!</Text>
                  )}
                </>
              )}
            </View>
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
  tabWrapper: { padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontWeight: '700', color: '#8E8E93', fontSize: 14 },
  activeTabText: { color: '#000' },

  // Empty State (Friends)
  emptyCenterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F9F9FB', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#000', marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  largeInviteBtn: { backgroundColor: '#c62828', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 15 },
  largeInviteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Global View Styles
  selector: { padding: 15 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  activeChip: { backgroundColor: '#c62828', borderColor: '#c62828' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#666' },
  activeChipText: { color: '#FFF' },

  leaderboardWrapper: { padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 5 },
  
  userRankBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 15, borderWidth: 2, borderColor: '#c62828', marginBottom: 20 },
  rankBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  
  rankNum: { width: 35, fontSize: 18, fontWeight: '900', color: '#000' },
  avatarRed: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#c62828', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarGray: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nameText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  scoreText: { fontSize: 16, fontWeight: '800', color: '#000' },
  
  dividerLarge: { height: 1, backgroundColor: '#EEE', marginVertical: 20, width: '95%', alignSelf: 'center' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#AAA', fontStyle: 'italic' },
  listContainer: { paddingHorizontal: 20 }
});