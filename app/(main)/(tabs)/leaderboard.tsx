import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- THE LIST IS NOW EMPTY ---
const FRIENDS_LEADERBOARD: any[] = []; 

export default function LeaderboardScreen() {
  const { fullName } = useUser();
  const isEmpty = FRIENDS_LEADERBOARD.length === 0;

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
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, isEmpty && { flex: 1 }]}
      >
        
        {/* TOP BUTTON (Only shows when list is NOT empty) */}
        {!isEmpty && (
          <TouchableOpacity style={styles.topInviteBtn} onPress={handleInviteFriends}>
            <Ionicons name="person-add" size={18} color="#c62828" />
            <Text style={styles.topInviteText}>Invite Friends</Text>
          </TouchableOpacity>
        )}

        {isEmpty ? (
          /* LARGE CENTERED EMPTY STATE */
          <View style={styles.emptyCenterContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={60} color="#c62828" />
            </View>
            <Text style={styles.emptyTitle}>Train with Friends</Text>
            <Text style={styles.emptySubtitle}>
              Working out is better together. Invite your friends to see their progress and compete on the leaderboard.
            </Text>
            <TouchableOpacity style={styles.largeInviteBtn} onPress={handleInviteFriends}>
              <Text style={styles.largeInviteBtnText}>Invite your first friend</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* LEADERBOARD CONTENT (This will stay hidden until you add friends) */
          <>
            <View style={styles.myRankContainer}>
              <Text style={styles.sectionLabel}>Your Ranking</Text>
              <View style={styles.myRankCard}>
                <View style={styles.rankInfo}>
                  <Text style={styles.myRankNumber}>#1</Text>
                  <View style={styles.divider} />
                  <View>
                    <Text style={styles.myName}>{fullName}</Text>
                    <Text style={styles.myPoints}>0 points</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.listContainer}>
              <Text style={styles.sectionLabel}>Friends Leaderboard</Text>
              {/* Rows would render here */}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 20 },

  topInviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 20,
    marginRight: 20,
  },
  topInviteText: { color: '#c62828', fontWeight: 'bold', fontSize: 13, marginLeft: 8 },

  emptyCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80, 
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 10 },
  emptySubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  largeInviteBtn: {
    backgroundColor: '#c62828',
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#c62828',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  largeInviteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  myRankContainer: { paddingHorizontal: 20, marginTop: 10, marginBottom: 30 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  myRankCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#c62828',
  },
  rankInfo: { flexDirection: 'row', alignItems: 'center' },
  myRankNumber: { fontSize: 24, fontWeight: '900', color: '#c62828', marginRight: 15 },
  divider: { width: 1, height: 30, backgroundColor: '#EEE', marginRight: 15 },
  myName: { fontSize: 16, fontWeight: '700', color: '#000' },
  myPoints: { fontSize: 13, color: '#666', marginTop: 2 },
  listContainer: { paddingHorizontal: 20 },
});