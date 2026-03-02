import { db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
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

interface Announcement {
  id: string;
  title: string;
  content: string;
  timestamp: any;
  type: 'info' | 'update' | 'alert';
}

export default function UpdatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to the global announcements collection
    const announcementsRef = collection(db, "announcements");
    const q = query(announcementsRef, orderBy("timestamp", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      
      setNotifications(docs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return { name: 'alert-circle', color: '#c62828', bg: '#FFEBEE' };
      case 'update': return { name: 'rocket', color: '#007AFF', bg: '#E3F2FD' };
      default: return { name: 'information-circle', color: '#8E8E93', bg: '#F2F2F7' };
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#c62828" /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Updates</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const iconConfig = getIcon(item.type);
          return (
            <View style={styles.updateCard}>
              <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.updateTitle}>{item.title}</Text>
                <Text style={styles.updateContent}>{item.content}</Text>
                <Text style={styles.updateDate}>
                  {item.timestamp?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={40} color="#CCC" />
            </View>
            <Text style={styles.emptyText}>Nothing to show, yet</Text>
            <Text style={styles.emptySubText}>
              We'll notify you here when there are updates to your training plan or social activity.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5E7' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  listContent: { padding: 15, paddingBottom: 40 },
  
  updateCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  updateTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  updateContent: { fontSize: 14, color: '#666', lineHeight: 20 },
  updateDate: { fontSize: 11, color: '#AAA', fontWeight: 'bold', marginTop: 8, textTransform: 'uppercase' },

  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 2 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptySubText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 10, lineHeight: 20 }
});