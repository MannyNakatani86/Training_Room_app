import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpdatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

      {/* CONTENT Area */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications-off-outline" size={40} color="#CCC" />
          </View>
          <Text style={styles.emptyText}>Nothing to show, yet</Text>
          <Text style={styles.emptySubText}>
            We'll notify you here when there are updates to your training plan or social activity.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' // Clean white background
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F7' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#000',
    letterSpacing: 0.5 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center' 
  },
  scrollContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyContainer: { 
    alignItems: 'center',
    marginTop: -50 // Nudge up slightly for visual balance
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#333' 
  },
  emptySubText: { 
    fontSize: 14, 
    color: '#8E8E93', 
    textAlign: 'center', 
    marginTop: 10,
    lineHeight: 20
  }
});