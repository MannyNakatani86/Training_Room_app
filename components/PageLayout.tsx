import { auth, db } from '@/fireBaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;
const APP_VERSION = "v1.0.0";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [fullName, setFullName] = useState('Athlete');
  const [handle, setHandle] = useState('athlete');

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docSnap = await getDoc(doc(db, "customers", user.uid));
        if (docSnap.exists()) {
          const name = docSnap.data().name;
          setFullName(name);
          setHandle(name.replace(/\s+/g, '_').toLowerCase());
        }
      }
    };
    fetchUserData();
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

  const sidebarTranslateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-SIDEBAR_WIDTH, 0] });
  const contentTranslateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SIDEBAR_WIDTH] });
  const overlayOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* --- SHARED SIDEBAR --- */}
      <Animated.View style={[styles.sidebar, { paddingTop: insets.top + 20, transform: [{ translateX: sidebarTranslateX }] }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.avatarCircle}><Ionicons name="person" size={35} color="#666" /></View>
          <View style={styles.sidebarUserInfo}>
            <Text style={styles.sidebarUserName}>{fullName}</Text>
            <Text style={styles.sidebarHandle}>@{handle}</Text>
          </View>
        </View>
        <View style={styles.sidebarMenuSection}>
          <TouchableOpacity style={styles.sidebarItem}><Ionicons name="calendar-outline" size={22} color="#333" /><Text style={styles.sidebarItemText}>My Bookings</Text></TouchableOpacity>
          <TouchableOpacity style={styles.sidebarItem}><Ionicons name="settings-outline" size={22} color="#333" /><Text style={styles.sidebarItemText}>Settings</Text></TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={() => auth.signOut()}><Ionicons name="log-out-outline" size={22} color="#c62828" /><Text style={styles.logoutText}>Sign Out</Text></TouchableOpacity>
        </View>
        <View style={[styles.sidebarFooter, { paddingBottom: insets.bottom + 20 }]}><Text style={styles.versionText}>{APP_VERSION}</Text></View>
      </Animated.View>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <Animated.View style={[styles.mainContent, { transform: [{ translateX: contentTranslateX }] }]}>
        {isMenuOpen && (
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <Pressable style={{ flex: 1 }} onPress={toggleMenu} />
          </Animated.View>
        )}

        {/* --- SHARED HEADER --- */}
        <View style={[styles.topBlock, { paddingTop: insets.top, height: 70 + insets.top }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerSide}>
              <TouchableOpacity onPress={toggleMenu} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Ionicons name="menu" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Image source={require('../assets/training_room_logo2.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.headerSide} />
          </View>
        </View>

        {/* THE ACTUAL PAGE CONTENT */}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR_WIDTH, backgroundColor: '#FFF', zIndex: 1, paddingHorizontal: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, marginTop: 10 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5' },
  sidebarUserInfo: { marginLeft: 15 },
  sidebarUserName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  sidebarHandle: { fontSize: 14, color: '#888', marginTop: 2 },
  sidebarMenuSection: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  sidebarItemText: { fontSize: 16, marginLeft: 15, color: '#333', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, marginTop: 10 },
  logoutText: { color: '#c62828', fontSize: 16, fontWeight: 'bold', marginLeft: 15 },
  sidebarFooter: { alignItems: 'center', width: '100%' },
  versionText: { color: '#CCC', fontSize: 12, fontWeight: '600' },
  mainContent: { flex: 1, backgroundColor: '#F2F2F7', zIndex: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99 },
  topBlock: { backgroundColor: '#000', paddingHorizontal: 15},
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { width: 50 },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 180, height: 180, marginTop: 10 },
});