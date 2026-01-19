import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.7;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 1. ANIMATION VALUE
  // 0 = Closed, 1 = Open
  const animValue = useRef(new Animated.Value(0)).current;

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // 2. TOGGLE FUNCTION
  const toggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open);
    Animated.timing(animValue, {
      toValue: open ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true, // Uses hardware acceleration
    }).start();
  };

  // 3. INTERPOLATIONS (Linking 0-1 to pixel movements)
  const sidebarTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH, 0], // Slides from off-screen left to 0
  });

  const contentTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SIDEBAR_WIDTH], // Slides home screen to the right
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* SIDEBAR (Animated) */}
      <Animated.View 
        style={[
          styles.sidebar, 
          { 
            paddingTop: insets.top + 20,
            transform: [{ translateX: sidebarTranslateX }] 
          }
        ]}
      >
        <Text style={styles.sidebarTitle}>Menu</Text>
        <TouchableOpacity style={styles.sidebarItem}>
          <IconSymbol name="person.fill" size={20} color="#333" />
          <Text style={styles.sidebarItemText}>My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem}>
          <IconSymbol name="gearshape.fill" size={20} color="#333" />
          <Text style={styles.sidebarItemText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutItem}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* MAIN CONTENT WRAPPER (This slides to the right) */}
      <Animated.View 
        style={[
          styles.mainContent, 
          { transform: [{ translateX: contentTranslateX }] }
        ]}
      >
        {/* Backdrop overlay when menu is open */}
        {isSidebarOpen && (
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={{ flex: 1 }} onPress={() => toggleSidebar(false)} />
          </Animated.View>
        )}

        {/* HEADER */}
        <View style={[styles.topBlock, { paddingTop: insets.top, height: 60 + insets.top }]}>
          <View style={styles.headerContent}>
            <View style={styles.sideContainer}>
              <TouchableOpacity 
                onPress={() => toggleSidebar(true)} 
                style={styles.menuButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="line.3.horizontal" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/training_room_logo2.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sideContainer} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.calendarCard}>
            <Calendar
              theme={{
                selectedDayBackgroundColor: '#c62828',
                todayTextColor: '#c62828',
                arrowColor: '#c62828',
                textMonthFontWeight: 'bold',
              }}
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={{
                [today]: { marked: true, dotColor: '#c62828' },
                [selectedDate]: { selected: true, selectedColor: '#c62828' }
              }}
            />
          </View>

          <TouchableOpacity style={styles.onboardingButton} activeOpacity={0.8}>
            <View style={styles.buttonIconCircle}>
              <IconSymbol name="phone.fill" size={20} color="#c62828" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Book Onboarding Call</Text>
              <Text style={styles.buttonSubtitle}>Schedule your 1-on-1 session</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Set background to black for a cleaner transition
  
  // ANIMATED SIDEBAR
  sidebar: { 
    position: 'absolute', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: SIDEBAR_WIDTH, 
    backgroundColor: '#FFF', 
    zIndex: 2, 
    paddingHorizontal: 20 
  },
  sidebarTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#000' },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  sidebarItemText: { fontSize: 16, marginLeft: 15, color: '#333' },
  logoutItem: { marginTop: 'auto', marginBottom: 40, paddingVertical: 15 },
  logoutText: { color: '#c62828', fontWeight: 'bold', fontSize: 16 },

  // MAIN CONTENT AREA
  mainContent: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    zIndex: 1,
  },
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    zIndex: 10 
  },

  // HEADER
  topBlock: {
    backgroundColor: '#000',
    paddingHorizontal: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideContainer: { width: 60, justifyContent: 'center' },
  menuButton: { width: 44, height: 44, justifyContent: 'center' },
  logoContainer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 110, height: 110, marginTop: 5 },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 15, alignItems: 'center' },
  calendarCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    width: '100%',
    padding: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  onboardingButton: {
    backgroundColor: '#c62828',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    elevation: 6,
  },
  buttonIconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  buttonTextContainer: { flex: 1, marginLeft: 15 },
  buttonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  buttonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});