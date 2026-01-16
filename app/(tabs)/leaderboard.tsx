import BottomTab from '@/components/bottom_tab';
import { StyleSheet, Text, View } from 'react-native';

export default function Leaderboard() {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Currently under construction.</Text>
      </View>

      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center' },
});
