import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PROGRAMS = [
  {
    id: '1',
    title: 'Functional Fitness',
    description: 'Designed to combine functional strength, endurance, and conditioning, this plan prepares athletes to perform at a high level in both the gym and competition settings, including CrossFit and HYROX.',
    duration: '4 Weeks',
    price: '$7.99',
    icon: 'body-outline'
  },
  {
    id: '2',
    title: 'Athlete Plan',
    description: 'Built for competitive athletes and experienced lifters, this plan maximizes strength to push your training to the next level.',
    duration: '4 Weeks',
    price: '$8.99',
    icon: 'flash-outline'
  },
  {
    id: '3',
    title: 'Beginner Plan',
    description: 'Whether you’re new to the gym or returning from an injury, this plan helps you build confidence, learn proper form, and develop a sustainable routine that fits your lifestyle.',
    duration: '4 Weeks',
    price: '$4.99',
    icon: 'leaf-outline'
  }
];

export default function ProgramsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TOP INTRO MESSAGE */}
        <View style={styles.introSection}>
          <Text style={styles.introSub}>
            With this purchase, you’ll receive a 4-week customized training plan tailored to your responses from the previous form.
          </Text>
        </View>

        {PROGRAMS.map((program) => (
          <View key={program.id} style={styles.programCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name={program.icon as any} size={24} color="#c62828" />
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{program.duration}</Text>
              </View>
            </View>

            <Text style={styles.programTitle}>{program.title}</Text>
            <Text style={styles.programDesc}>{program.description}</Text>

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.buyBtn}>
                <Text style={styles.buyBtnText}>Purchase Plan • {program.price}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#000' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  
  scrollContent: { padding: 20 },
  
  introSection: { marginBottom: 25, paddingHorizontal: 5 },
  introSub: { fontSize: 15, color: '#444', fontWeight: '600', lineHeight: 22 },

  programCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  iconCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#FFEBEE', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badge: { 
    backgroundColor: '#F2F2F7', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#666' },
  
  programTitle: { fontSize: 22, fontWeight: '900', color: '#000', marginBottom: 10 },
  programDesc: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 25 },
  
  cardFooter: { 
    borderTopWidth: 1, 
    borderTopColor: '#F2F2F7', 
    paddingTop: 15 
  },
  buyBtn: { 
    backgroundColor: '#c62828', 
    paddingVertical: 15, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  buyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});