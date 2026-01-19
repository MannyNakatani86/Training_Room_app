import { Ionicons } from '@expo/vector-icons';
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
const SIDEBAR_WIDTH = width * 0.5;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // --- ANIMATION LOGIC ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const sidebarTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH, 0],
  });

  const contentTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SIDEBAR_WIDTH],
  });

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 1. SIDEBAR MENU (Z-Index 1) */}
      <Animated.View 
        style={[
          styles.sidebar, 
          { 
            paddingTop: insets.top + 20, 
            transform: [{ translateX: sidebarTranslateX }] 
          }
        ]}
      >
        <Text style={styles.menuTitle}>Training Room</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={22} color="#333" />
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={22} color="#333" />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 2. MAIN CONTENT (Z-Index 2) */}
      <Animated.View 
        style={[
          styles.mainContent, 
          { transform: [{ translateX: contentTranslateX }] }
        ]}
      >
        {/* TINTED OVERLAY - Only blocks touches when menu is open */}
        {isMenuOpen && (
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={{ flex: 1 }} onPress={toggleMenu} />
          </Animated.View>
        )}

        {/* HEADER */}
        <View style={[styles.topBlock, { paddingTop: insets.top, height: 70 + insets.top }]}>
          <View style={styles.headerContent}>
            
            {/* LEFT: Menu Button */}
            <View style={styles.headerSide}>
              <TouchableOpacity 
                style={styles.menuButton} 
                onPress={toggleMenu}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // Makes it much easier to tap
              >
                <Ionicons name="menu" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* CENTER: Logo (No longer absolute, so it can't block the button) */}
            <View style={styles.headerCenter}>
              <Image 
                source={require('../../../assets/training_room_logo2.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* RIGHT: Empty spacer */}
            <View style={styles.headerSide} />
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
              <Ionicons name="call" size={20} color="#c62828" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Book Onboarding Call</Text>
              <Text style={styles.buttonSubtitle}>Schedule your 1-on-1 session</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  sidebar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFF',
    zIndex: 1,
    paddingHorizontal: 25,
  },
  menuTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  menuItemText: { fontSize: 16, marginLeft: 15 },
  logoutButton: { marginTop: 'auto', marginBottom: 50 },
  logoutText: { color: '#c62828', fontSize: 16, fontWeight: 'bold' },

  mainContent: { flex: 1, backgroundColor: '#F2F2F7', zIndex: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99 },
  
  topBlock: {
    backgroundColor: '#000',
    paddingHorizontal: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 50, // Reserves specific space on left and right
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: { width: 110, height: 110, marginTop: 10 },
  
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
  },
  buttonIconCircle: { width: 45, height: 45, backgroundColor: '#FFF', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  buttonTextContainer: { flex: 1, marginLeft: 15 },
  buttonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  buttonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});