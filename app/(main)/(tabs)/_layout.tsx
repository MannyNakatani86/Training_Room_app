import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;
const APP_VERSION = "v1.0.4";

const UserContext = createContext({ fullName: '', handle: '', memberSince: '', profileImage: '' });
export const useUser = () => useContext(UserContext);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const [fullName, setFullName] = useState('Athlete');
  const [handle, setHandle] = useState('athlete');
  const [memberSince, setMemberSince] = useState('');
  const [profileImage, setProfileImage] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, "customers", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFullName(data.name || 'Athlete');
        setHandle((data.name || 'athlete').replace(/\s+/g, '_').toLowerCase());
        setProfileImage(data.profileImage || '');
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          setMemberSince(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        }
      }
    });
    return () => unsub();
  }, []);

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

  // Helper to close sidebar and move to a new page
  const navigateAndClose = (path: any) => {
    toggleMenu();
    router.push(path);
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
    <UserContext.Provider value={{ fullName, handle, memberSince, profileImage }}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* --- SIDEBAR --- */}
        <Animated.View style={[styles.sidebar, { paddingTop: insets.top + 20, transform: [{ translateX: sidebarTranslateX }] }]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.avatarCircle}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.sidebarPhoto} />
              ) : (
                <Ionicons name="person" size={35} color="#666" />
              )}
            </View>
            <View style={styles.sidebarUserInfo}>
              <Text style={styles.sidebarUserName}>{fullName}</Text>
              <Text style={styles.sidebarHandle}>@{handle}</Text>
            </View>
          </View>

          <View style={styles.sidebarMenuSection}>
            {/* Account -> Profile Tab */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateAndClose('/profile')}>
              <Ionicons name="person-outline" size={22} color="#333" />
              <Text style={styles.sidebarItemText}>Account</Text>
            </TouchableOpacity>

            {/* Plan -> Programs Tab */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateAndClose('/(main)/programs')}>
              <Ionicons name="list-outline" size={22} color="#333" />
              <Text style={styles.sidebarItemText}>Plan</Text>
            </TouchableOpacity>

            {/* Calendar -> Workouts Tab */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateAndClose('/workouts')}>
              <Ionicons name="calendar-outline" size={22} color="#333" />
              <Text style={styles.sidebarItemText}>Workout Calendar</Text>
            </TouchableOpacity>

            {/* Your Updates -> Custom Page */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateAndClose('/(main)/updates')}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
              <Text style={styles.sidebarItemText}>Your Updates</Text>
            </TouchableOpacity>

            {/* Settings -> Custom Page */}
            <TouchableOpacity style={styles.sidebarItem} onPress={() => navigateAndClose('/(main)/settings')}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#333" />
              <Text style={styles.sidebarItemText}>Settings and Privacy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.logoutButton, { marginTop: 20 }]} onPress={() => auth.signOut()}>
              <Ionicons name="log-out-outline" size={22} color="#c62828" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.sidebarFooter, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.versionText}>{APP_VERSION}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.mainWrapper, { transform: [{ translateX: contentTranslateX }] }]}>
          {isMenuOpen && (
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
              <Pressable style={{ flex: 1 }} onPress={toggleMenu} />
            </Animated.View>
          )}

          <View style={[
            styles.topBlock, 
            { 
              paddingTop: insets.top, 
              height: 70 + insets.top 
            }
          ]}>
            <View style={styles.headerContent}>
              <View style={styles.headerSide}>
                <TouchableOpacity onPress={toggleMenu} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                  <Ionicons name="menu" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.headerCenter}>
                <Image 
                  source={require('../../../assets/training_room_logo2.png')} 
                  style={styles.logo} 
                  resizeMode="contain" 
                />
              </View>

              <View style={styles.headerSide} />
            </View>
          </View>

          <Tabs
            screenOptions={{
              tabBarActiveTintColor: '#c62828',
              headerShown: false,
              tabBarStyle: {
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#E5E5E5',
                height: 90,
                paddingBottom: 30,
              },
            }}>
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
            <Tabs.Screen name="workouts" options={{ title: 'Workouts', tabBarIcon: ({ color }) => <Ionicons name="barbell" size={24} color={color} /> }} />
            <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard', tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
          </Tabs>
        </Animated.View>
      </View>
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: '#FFF', zIndex: 1, paddingHorizontal: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, marginTop: 10 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5', overflow: 'hidden' },
  sidebarPhoto: { width: 60, height: 60, borderRadius: 30 },
  sidebarUserInfo: { marginLeft: 15 },
  sidebarUserName: { fontSize: 18, fontWeight: 'bold' },
  sidebarHandle: { fontSize: 14, color: '#888' },
  sidebarMenuSection: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  sidebarItemText: { fontSize: 16, marginLeft: 15, fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  logoutText: { color: '#c62828', fontSize: 16, fontWeight: 'bold', marginLeft: 15 },
  sidebarFooter: { alignItems: 'center' },
  versionText: { color: '#CCC', fontSize: 12, fontWeight: '600' },
  mainWrapper: { flex: 1, backgroundColor: '#F2F2F7', zIndex: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999 },
  topBlock: { 
    backgroundColor: '#000', 
    paddingHorizontal: 15,
    zIndex: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  headerSide: { width: 50 },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  menuButton: { width: 44, height: 44, justifyContent: 'center' },
  logo: { 
    width: 180, 
    height: 50, 
    paddingTop: 2,
  },
});