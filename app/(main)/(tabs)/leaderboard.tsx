import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from './_layout';

// Mock data for the leaderboard
const LEADERBOARD_DATA = [
  { id: '1', name: 'Alex Johnson', points: 2850, avatar: null, rank: 1 },
  { id: '2', name: 'Sarah Miller', points: 2720, avatar: null, rank: 2 },
  { id: '3', name: 'Jordan Smith', points: 2680, avatar: null, rank: 3 },
  { id: '4', name: 'Chris Evans', points: 2450, avatar: null, rank: 4 },
  { id: '5', name: 'Jessica Alba', points: 2300, avatar: null, rank: 5 },
  { id: '6', name: 'David Beckham', points: 2150, avatar: null, rank: 6 },
];

export default function LeaderboardScreen() {
  const { fullName } = useUser();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 1. TOP PODIUM SECTION */}
        <View style={styles.podiumContainer}>
          <View style={styles.podium}>
            {/* 2nd Place */}
            <View style={[styles.podiumSpot, styles.spot2]}>
              <View style={[styles.avatarCircle, styles.silverRing]}>
                <Ionicons name="person" size={30} color="#AAA" />
              </View>
              <Text style={styles.podiumName}>{LEADERBOARD_DATA[1].name.split(' ')[0]}</Text>
              <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.rankBadgeText}>2</Text>
              </View>
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumSpot, styles.spot1]}>
              <View style={[styles.avatarCircle, styles.goldRing, { width: 90, height: 90, borderRadius: 45 }]}>
                <Ionicons name="person" size={45} color="#666" />
              </View>
              <Text style={[styles.podiumName, { fontWeight: 'bold' }]}>{LEADERBOARD_DATA[0].name.split(' ')[0]}</Text>
              <View style={[styles.rankBadge, { backgroundColor: '#FFD700', width: 30, height: 30, borderRadius: 15 }]}>
                <Text style={styles.rankBadgeText}>1</Text>
              </View>
            </View>

            {/* 3rd Place */}
            <View style={[styles.podiumSpot, styles.spot3]}>
              <View style={[styles.avatarCircle, styles.bronzeRing]}>
                <Ionicons name="person" size={30} color="#CD7F32" />
              </View>
              <Text style={styles.podiumName}>{LEADERBOARD_DATA[2].name.split(' ')[0]}</Text>
              <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.rankBadgeText}>3</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. USER'S CURRENT RANKING (Canvas Style Card) */}
        <View style={styles.myRankContainer}>
          <Text style={styles.sectionLabel}>Your Ranking</Text>
          <View style={styles.myRankCard}>
            <View style={styles.rankInfo}>
              <Text style={styles.myRankNumber}>#12</Text>
              <View style={styles.divider} />
              <View>
                <Text style={styles.myName}>{fullName}</Text>
                <Text style={styles.myPoints}>1,420 points</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewHistory}>
              <Text style={styles.viewHistoryText}>View Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. LEADERBOARD LIST */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionLabel}>All Time High Scores</Text>
          {LEADERBOARD_DATA.map((item) => (
            <View key={item.id} style={styles.rankRow}>
              <Text style={styles.rowRank}>#{item.rank}</Text>
              <View style={styles.rowAvatar}>
                <Ionicons name="person-circle" size={40} color="#DDD" />
              </View>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPoints}>{item.points.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  
  // Podium Styles
  podiumContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 160,
  },
  podiumSpot: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  spot1: { marginBottom: 10 },
  spot2: { marginBottom: 0 },
  spot3: { marginBottom: 0 },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EEE',
  },
  goldRing: { borderColor: '#FFD700', borderWidth: 3 },
  silverRing: { borderColor: '#C0C0C0', borderWidth: 3 },
  bronzeRing: { borderColor: '#CD7F32', borderWidth: 3 },
  podiumName: { marginTop: 8, fontSize: 14, color: '#333' },
  rankBadge: {
    position: 'absolute',
    top: 55,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  rankBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // My Rank Section
  myRankContainer: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  myRankCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0078d4', // Canvas Blue outline
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankInfo: { flexDirection: 'row', alignItems: 'center' },
  myRankNumber: { fontSize: 24, fontWeight: 'bold', color: '#0078d4', marginRight: 15 },
  divider: { width: 1, height: 30, backgroundColor: '#DDD', marginRight: 15 },
  myName: { fontSize: 16, fontWeight: '600' },
  myPoints: { fontSize: 13, color: '#666' },
  viewHistory: {
    backgroundColor: '#f0f7ff', // Very light blue to match the Canvas theme
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewHistoryText: { 
    color: '#0078d4', 
    fontWeight: '600', 
    fontSize: 14 
  },

  // List Styles
  listContainer: { paddingHorizontal: 20 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  rowRank: { width: 40, fontSize: 16, fontWeight: '600', color: '#888' },
  rowAvatar: { marginRight: 12 },
  rowName: { flex: 1, fontSize: 16, color: '#333' },
  rowPoints: { fontSize: 16, fontWeight: 'bold', color: '#0078d4' },
});