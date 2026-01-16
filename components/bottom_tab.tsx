import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function BottomTab() {
  const router = useRouter();
  const pathname = usePathname();

  // Remove /(tabs) prefix if using a tab group
  const cleanedPath = pathname.replace(/^\/\(tabs\)/, '');

  // Determine which tab is active
  const activeTab: 'home' | 'leaderboard' | 'profile' =
    cleanedPath.startsWith('/home') ? 'home' :
    cleanedPath.startsWith('/leaderboard') ? 'leaderboard' :
    cleanedPath.startsWith('/profile') ? 'profile' :
    'home'; // fallback

  return (
    <View style={styles.tabBar}>
      {/* Leaderboard */}
      <Pressable style={styles.tabButton} onPress={() => router.push('/leaderboard')}>
        <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeText]}>
          Leaderboard
        </Text>
      </Pressable>

      {/* Home */}
      <Pressable style={styles.tabButton} onPress={() => router.push('/home')}>
        <Text style={[styles.tabText, activeTab === 'home' && styles.activeText]}>
          Home
        </Text>
      </Pressable>

      {/* Profile */}
      <Pressable style={styles.tabButton} onPress={() => router.push('/profile')}>
        <Text style={[styles.tabText, activeTab === 'profile' && styles.activeText]}>
          Profile
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    height: 70,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#111', // dark background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#888',       // default grey
    fontSize: 16,
    fontWeight: '600',
  },
  activeText: {
    color: '#FF2D2D',    // red for active tab
  },
});
