import OnboardingModal from '@/components/OnboardingModal';
import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // Full width minus horizontal padding

export default function HomeScreen() {
  const [firstName, setFirstName] = useState('Athlete');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Generate a list of the next 7 days for the swipeable section
  const workoutDays = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      id: i.toString(),
      dateLabel: i === 0 ? "TODAY" : i === 1 ? "TOMORROW" : date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
      fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  useEffect(() => {
    const fetchName = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "customers", user.uid));
        if (docSnap.exists()) {
          setFirstName(docSnap.data().name.split(' ')[0]);
        }
      }
    };
    fetchName();
  }, []);

  // Update dots based on scroll position
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const renderWorkoutCard = ({ item }: { item: typeof workoutDays[0] }) => (
    <View style={styles.cardContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleText}>{item.dateLabel} • {item.fullDate}</Text>
      </View>
      <View style={styles.workoutPlaceholderCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="barbell-outline" size={32} color="#AAA" />
        </View>
        <Text style={styles.noWorkoutText}>No workout for the day</Text>
        <TouchableOpacity style={styles.planButton}>
          <Text style={styles.planButtonText}>Plan Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* 1. GREETING */}
        <View style={styles.greetingContainer}>
          <Text style={styles.welcomeText}>Hi {firstName},</Text>
          <Text style={styles.subtitleText}>Consistency is the key to progress.</Text>
        </View>

        {/* 2. SWIPEABLE WORKOUT SECTION */}
        <FlatList
          data={workoutDays}
          renderItem={renderWorkoutCard}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToAlignment="center"
          decelerationRate="fast"
          keyExtractor={(item) => item.id}
        />

        {/* 3. PAGINATION DOTS */}
        <View style={styles.paginationDots}>
          {workoutDays.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                activeIndex === i ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>

        {/* 4. ONBOARDING CALL BUTTON */}
        <TouchableOpacity 
          style={styles.onboardingButton} 
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIconCircle}>
            <Ionicons name="call" size={20} color="#c62828" />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Book Onboarding Call</Text>
            <Text style={styles.buttonSubtitle}>Schedule your 1-on-1 session</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>

      <OnboardingModal 
        isVisible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { 
    paddingTop: 25, 
    paddingBottom: 40 
  },
  greetingContainer: { 
    paddingHorizontal: 20,
    marginBottom: 20 
  },
  welcomeText: { fontSize: 28, fontWeight: '900', color: '#000' },
  subtitleText: { fontSize: 15, color: '#666', marginTop: 5 },
  
  cardContainer: {
    width: width,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8e8e93',
    letterSpacing: 1,
  },
  workoutPlaceholderCard: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  noWorkoutText: { fontSize: 16, color: '#999', fontWeight: '500', marginBottom: 20 },
  planButton: { backgroundColor: '#000', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  planButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#c62828',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#DDD',
  },

  onboardingButton: { 
    marginHorizontal: 20,
    backgroundColor: '#c62828', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 25,
    elevation: 5,
  },
  buttonIconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  buttonTextContainer: { flex: 1, marginLeft: 15 },
  buttonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  buttonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});