import { auth, db } from '@/fireBaseConfig';
import { submitVerificationRequest } from '@/services/workoutService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions, Modal,
  ScrollView,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../_layout';

const { width } = Dimensions.get('window');

const EXERCISE_LIST = [
  "Bench Press", "Back Squat", "Front Squat", "Incline Bench Press", 
  "Deadlift", "Clean", "Snatch", "Jerk", "Push Press", "Trap Bar Deadlift"
];

export default function LeaderboardScreen() {
  const { fullName, unit } = useUser();
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('global');
  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_LIST[0]);
  
  const [globalData, setGlobalData] = useState<any[]>([]);
  const [friendsData, setFriendsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      query(collection(db, "leaderboards", selectedExercise, "rankings"), orderBy("score", "desc")),
      (snapshot) => {
        const rankings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGlobalData(rankings);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [selectedExercise]);

  const formatWeight = (kg: number) => {
    if (unit === 'lbs') return `${Math.round(kg / 0.453592)} lbs`;
    return `${Math.round(kg)} kg`;
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setVideoUri(result.assets[0].uri);
  };

  const handleVerifySubmit = async () => {
    if (!videoUri) return Alert.alert("Video Required", "Please attach a video of your lift.");
    setIsSubmitting(true);
    const userRankData = globalData.find(item => item.userId === auth.currentUser?.uid);
    const res = await submitVerificationRequest(
        auth.currentUser!.uid, 
        fullName, 
        selectedExercise, 
        userRankData?.score || 0, 
        videoUri
    );
    if (res.success) {
      Alert.alert("Request Sent", "Our coaches will review your lift shortly.");
      setVerifyModalVisible(false);
    }
    setIsSubmitting(false);
  };

  const handleAddFriend = (userId: string, userName: string) => {
    Alert.alert(
      "Add Friend",
      `Send a friend request to ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send Request", onPress: () => console.log(`Request sent to ${userId}`) }
      ]
    );
  };

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <Ionicons name="medal" size={24} color="#FFD700" />;
    if (rank === 2) return <Ionicons name="medal" size={24} color="#C0C0C0" />;
    if (rank === 3) return <Ionicons name="medal" size={24} color="#CD7F32" />;
    return <Text style={styles.rankNumText}>{rank}</Text>;
  };

  const userIndex = globalData.findIndex(item => item.userId === auth.currentUser?.uid);
  const userRankData = userIndex !== -1 ? { ...globalData[userIndex], rank: userIndex + 1 } : null;

  return (
    <View style={styles.container}>
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'local' && styles.activeTab]} onPress={() => setActiveTab('local')}><Text style={[styles.tabText, activeTab === 'local' && styles.activeTabText]}>Friends</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'global' && styles.activeTab]} onPress={() => setActiveTab('global')}><Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>Global</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'global' ? (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
              {EXERCISE_LIST.map(ex => (
                <TouchableOpacity key={ex} style={[styles.chip, selectedExercise === ex && styles.activeChip]} onPress={() => setSelectedExercise(ex)}>
                  <Text style={[styles.chipText, selectedExercise === ex && styles.activeChipText]}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.leaderboardWrapper}>
              <Text style={styles.sectionLabel}>Your Standing</Text>
              <View style={styles.userRankBar}>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankNum}>#{userRankData ? userRankData.rank : '--'}</Text>
                  <View style={styles.userInfo}>
                    <Text style={styles.nameText}>{fullName} {userRankData?.verified && <Ionicons name="checkmark-circle" size={14} color="#007AFF" />}</Text>
                    <Text style={styles.scoreText}>{userRankData ? formatWeight(userRankData.score) : 'No data'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.verifyBtn} onPress={() => setVerifyModalVisible(true)}>
                    <Text style={styles.verifyBtnText}>Verify Lift</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerLarge} />

              <Text style={styles.sectionLabel}>Top 10 Performers</Text>
              {loading ? <ActivityIndicator color="#c62828" /> : 
                globalData.slice(0, 10).map((user, index) => (
                  <View key={index} style={styles.rankBar}>
                    <View style={styles.rankIconContainer}>{renderRankIcon(index + 1)}</View>
                    <Text style={styles.rowName}>{user.userName} {user.verified && <Ionicons name="checkmark-circle" size={14} color="#007AFF" />}</Text>
                    <Text style={styles.rowScore}>{formatWeight(user.score)}</Text>
                    
                    {user.userId !== auth.currentUser?.uid && (
                      <TouchableOpacity 
                        style={styles.addFriendIconBtn} 
                        onPress={() => handleAddFriend(user.userId, user.userName)}
                      >
                        <Ionicons name="person-add-outline" size={20} color="#c62828" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              }
            </View>
          </View>
        ) : (
          <View style={styles.friendsContainer}>
             {/* Header simplified (Search button removed) */}
             <Text style={styles.sectionLabel}>Friends Activity</Text>

             {friendsData.length === 0 ? (
               <View style={styles.emptyFriends}>
                  <Ionicons name="people-outline" size={60} color="#CCC" />
                  <Text style={styles.emptyText}>Invite friends to compete!</Text>
                  <TouchableOpacity style={styles.inviteBtn}>
                    <Text style={styles.inviteBtnText}>Add Friends</Text>
                  </TouchableOpacity>
               </View>
             ) : (
               friendsData.map((f, i) => (
                 <View key={i} style={styles.rankBar}>
                    <Text style={styles.rowName}>{f.userName}</Text>
                    <Text style={styles.rowScore}>{formatWeight(f.score)}</Text>
                 </View>
               ))
             )}
          </View>
        )}
      </ScrollView>

      {/* VERIFICATION MODAL */}
      <Modal visible={verifyModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Your {selectedExercise}</Text>
            <Text style={styles.modalSub}>Upload a video of your max lift. Our team will review the form and depth to grant your verification tick.</Text>
            
            <TouchableOpacity style={styles.uploadBox} onPress={pickVideo}>
              <Ionicons name={videoUri ? "videocam" : "cloud-upload-outline"} size={40} color="#c62828" />
              <Text style={styles.uploadText}>{videoUri ? "Video Attached" : "Select Video Proof"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitVerifyBtn} onPress={handleVerifySubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitVerifyText}>Submit for Review</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setVerifyModalVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  tabWrapper: { padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { fontWeight: '700', color: '#888', fontSize: 14 },
  activeTabText: { color: '#000' },
  selector: { padding: 15 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#EEE' },
  activeChip: { backgroundColor: '#c62828', borderColor: '#c62828' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#666' },
  activeChipText: { color: '#FFF' },
  leaderboardWrapper: { padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', marginBottom: 12, marginLeft: 5 },
  
  userRankBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 18, borderRadius: 15, borderWidth: 2, borderColor: '#c62828', marginBottom: 20 },
  rankInfo: { flexDirection: 'row', alignItems: 'center' },
  rankNum: { fontSize: 24, fontWeight: '900', color: '#c62828', marginRight: 15 },
  userInfo: { gap: 2 },
  nameText: { fontSize: 16, fontWeight: '700' },
  scoreText: { fontSize: 14, color: '#666', fontWeight: '600' },
  verifyBtn: { backgroundColor: '#F2F2F7', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  verifyBtnText: { color: '#007AFF', fontSize: 12, fontWeight: 'bold' },

  rankBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  rankIconContainer: { width: 40, alignItems: 'center' },
  rankNumText: { fontSize: 16, fontWeight: '800', color: '#8E8E93' },
  rowName: { flex: 1, fontSize: 15, fontWeight: '600', marginLeft: 10 },
  rowScore: { fontSize: 15, fontWeight: '800', color: '#000', marginRight: 10 },

  addFriendIconBtn: { padding: 5, marginLeft: 5 },
  emptyText: { marginTop: 15, color: '#888', fontWeight: '600' },
  inviteBtn: { marginTop: 20, backgroundColor: '#c62828', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
  inviteBtnText: { color: '#FFF', fontWeight: 'bold' },

  dividerLarge: { height: 1, backgroundColor: '#DDD', marginVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', borderRadius: 25, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  modalSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  uploadBox: { height: 120, borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  uploadText: { marginTop: 10, fontWeight: 'bold', color: '#888' },
  submitVerifyBtn: { backgroundColor: '#c62828', padding: 18, borderRadius: 12, alignItems: 'center' },
  submitVerifyText: { color: '#FFF', fontWeight: 'bold' },
  cancelBtn: { alignItems: 'center', marginTop: 15 },
  friendsContainer: { padding: 20 },
  emptyFriends: { alignItems: 'center', marginTop: 50 }
});